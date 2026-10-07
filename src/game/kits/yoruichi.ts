// Yoruichi's kit (docs/roster/A3-urahara-shop-and-shiba.md §2, Kit proposal). The Flash Goddess: the
// fastest Shunpo in the roster, and a Hakuda string of kicks (snap kick, spinning heel, flying knee, double
// palm, axe heel). RMB is the concentrated blow. Q is Utsusemi: the cast-off shell stays where she stood and
// takes the attack while she is already behind the target. E is the Shunshin flurry (strikes from every
// side, one per flash step), R is Raiōken (a blur of punches and a final blow), and G is Anken (boot knives).
// F: Shunkō — the orange layer tears away, compressed lightning Kidō covers her back and arms, every blow
// stuns, RMB fires the Kidō out of her body in a cone that tears up the ground, and G becomes Hanki (her own
// counter-spun Kidō cancels projectiles and freezes the casters). F again: Raijin Senkei, for twenty seconds.
// A ring of thunder drums stands on her back. RMB brings the column of lightning down on the target and Q
// throws the drums' blinding light orbs.
import * as THREE from 'three';
import { FighterAction, type Fighter, type FighterDef } from '../fighter';
import type { Game, Projectile } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { yoruichiAsset } from '../../chars/yoruichi';
import { YORUICHI_CHAIN, YORUICHI_CLIPS, YORUICHI_STANCE } from '../../chars/yoruichiClips';
import { BOLT_RAIJIN, BOLT_SHUNKO, BlindOrb, DrumRing, Kunai, ShunkoField, ThunderColumn, shunkoBurst, type BoltStyle } from '../../vfx/shunko';
import { MirrorDecoy } from '../../vfx/mirror';
import { ConeShape, SphereShape } from '../../destruction/shapes';
import { raycastVoxels } from '../../voxel/raycast';
import { groundAt } from '../../vfx/iceArts';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

export const AURA_YORUICHI: AuraStyle = { core: '#F6E4EC', body: '#D86A8A', rim: '#7A1630' };
export const AURA_SHUNKO: AuraStyle = { core: '#F6F2FF', body: '#DBD9F0', rim: '#B8A8FF' };
export const AURA_RAIJIN: AuraStyle = { core: '#FFF6C8', body: '#F3EE51', rim: '#D17B07' };

const RAIJIN_TIME = 20;

export const YORUICHI_DEF: FighterDef = {
  id: 'yoruichi',
  name: 'Yoruichi Shihōin',
  title: 'Flash Goddess',
  build: () => ({ asset: yoruichiAsset('standard'), props: [] }),
  stance: YORUICHI_STANCE,
  clips: YORUICHI_CLIPS,
  aura: AURA_YORUICHI,
  hp: 1000,
  rei: 150,
  speed: { run: 12, sprint: 34, jump: 14, dash: 30, dashTime: 0.08 },
  radius: 0.3,
  height: 1.56,
};

const SPEED_SHUNKO = { run: 13, sprint: 38, jump: 15, dash: 34, dashTime: 0.08 };

type Form = 'standard' | 'shunko' | 'raijin';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

interface StrikeSpec {
  damage: number;
  knock: number;
  launch?: number;
  heavy?: boolean;
  /** hit sphere: reach along her facing, height, radius (m) */
  reach: number;
  height: number;
  radius: number;
  lunge: number;
  /** the striking limb's socket (sparks, trails) */
  limb: string;
  /** the axe heel: it cratering the ground */
  slam?: boolean;
}

const STRIKES: Record<string, StrikeSpec> = {
  yr_snap: { damage: 12, knock: 6, reach: 1.0, height: 1.0, radius: 0.75, lunge: 6, limb: 'toe.R' },
  yr_spin: { damage: 16, knock: 13, reach: 0.95, height: 1.3, radius: 0.9, lunge: 5, limb: 'toe.L' },
  yr_knee: { damage: 15, knock: 4, launch: 7, reach: 0.65, height: 1.1, radius: 0.8, lunge: 7, limb: 'toe.R' },
  yr_palm: { damage: 14, knock: 15, reach: 0.95, height: 1.15, radius: 0.8, lunge: 6, limb: 'palm.R' },
  yr_axe: { damage: 24, knock: 3, heavy: true, reach: 0.95, height: 0.7, radius: 1.0, lunge: 4, limb: 'heel.R', slam: true },
  yr_strikeA: { damage: 13, knock: 6, reach: 0.9, height: 1.1, radius: 0.85, lunge: 0, limb: 'toe.R' },
  yr_strikeB: { damage: 13, knock: 6, reach: 0.95, height: 1.15, radius: 0.85, lunge: 0, limb: 'palm.R' },
  yr_strikeC: { damage: 13, knock: 6, launch: 3, reach: 0.8, height: 1.2, radius: 0.85, lunge: 0, limb: 'toe.L' },
};

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

function aim(f: Fighter, g: Game, out = new THREE.Vector3()): THREE.Vector3 {
  if (f.faceTarget) return out.copy(f.faceTarget);
  if (f === g.player) return g.aimPoint(f, out);
  return f.center(out).addScaledVector(f.forward(_v), 30);
}

function teleport(f: Fighter, p: THREE.Vector3): void {
  f.body.pos.copy(p);
  f.body.prev.copy(p);
  f.body.vel.set(0, 0, 0);
  f.push.set(0, 0, 0);
}

/** How far she can go from `from` along `dir` before a wall (keeps a margin). */
function clearance(g: Game, from: THREE.Vector3, dir: THREE.Vector3, want: number): number {
  const hit = raycastVoxels(g.engine.world, from.x, from.y + 1, from.z, dir.x, 0, dir.z, want + 0.6);
  return hit ? Math.max(0, hit.dist - 0.6) : want;
}

/** One blow: everyone in the sphere ahead of her is hit. Returns whom it hit. */
function strike(kit: YoruichiKit, f: Fighter, g: Game, s: StrikeSpec, hits: Set<number>, mult = 1): Fighter[] {
  const fw = f.forward(_w);
  const c = new THREE.Vector3().copy(f.pos).addScaledVector(fw, s.reach);
  c.y += s.height;
  const out: Fighter[] = [];
  for (const o of g.enemiesOf(f)) {
    if (hits.has(o.id)) continue;
    const cy = Math.max(o.pos.y + 0.15, Math.min(o.pos.y + o.def.height - 0.15, c.y));
    if (Math.hypot(o.pos.x - c.x, cy - c.y, o.pos.z - c.z) > s.radius + o.def.radius) continue;
    hits.add(o.id);
    const dir = _v.subVectors(o.pos, f.pos).setY(0);
    if (dir.lengthSq() < 1e-4) dir.copy(fw);
    dir.normalize();
    g.damage(o, s.damage * mult, f, dir.clone(), { knock: s.knock, launch: s.launch, heavy: s.heavy, hitstop: 0.045, shake: 0.12 });
    const at = new THREE.Vector3(o.pos.x, cy, o.pos.z);
    g.sparks(at, dir, kit.form === 'standard' ? '#F3E9D8' : '#E6DEFF', 10);
    kit.zap(o, at);
    out.push(o);
  }
  return out;
}

// ------------------------------------------------------------------ the string

class StrikeAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private hitAt = 0;
  private struck = false;
  private hits = new Set<number>();
  queued = false;

  constructor(readonly kit: YoruichiKit, readonly clip: string, readonly index: number, readonly chained = true) {
    super();
    this.name = clip;
    this.mobility = 0.12;
    this.airGravity = 0.1;
  }

  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.65;
    this.hitAt = c.events.hit ?? this.dur * 0.4;
    const s = STRIKES[this.clip];
    f.anim.play(this.clip, {
      fadeIn: 0.03,
      onEvent: (n) => {
        if (n !== 'step') return;
        const tgt = f.faceTarget;
        const extra = tgt ? Math.min(5, Math.max(0, f.pos.distanceTo(tgt) - 1.4)) : 0;
        f.push.addScaledVector(f.forward(), s.lunge + extra * 2.4);
        g.sfx.play('swing', f.center(), 0.7);
      },
    });
  }

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const s = STRIKES[this.clip];
    // the striking limb leaves a short streak through the air
    if (this.t > this.hitAt - 0.08 && this.t < this.hitAt + 0.05) this.kit.limbTrail(sock(f, s.limb));
    if (!this.struck && this.t >= this.hitAt) {
      this.struck = true;
      strike(this.kit, f, g, s, this.hits);
      if (s.slam) {
        const h = sock(f, s.limb);
        const gy = groundAt(g, h.x, h.y + 0.5, h.z, 3);
        if (gy !== null) g.groundImpact(new THREE.Vector3(h.x, gy, h.z), this.kit.form === 'standard' ? 1.4 : 2.2, this.kit.form === 'standard' ? 180 : 300, this.kit.form === 'raijin' ? '#F3EE51' : this.kit.form === 'shunko' ? '#DBD9F0' : '#E9DDBD', f);
        if (this.kit.form !== 'standard' && gy !== null) shunkoRing(g, f, new THREE.Vector3(h.x, gy, h.z), 2.6, this.kit.bolt());
      }
    }
    if (this.chained && this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.kit.chain(this.index + 1);
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }

  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= this.hitAt + 0.02;
    return false;
  }
}

abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: YoruichiKit) {
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
}

/** A ring of lightning bursting out along the ground round a point (scorched). */
function shunkoRing(g: Game, f: Fighter, at: THREE.Vector3, r: number, style: BoltStyle): void {
  g.engine.destruction.carve(new SphereShape(at.clone(), r, 0.22), { mode: 'burn', power: 300, dust: 0.2 });
  const c = new THREE.Color(style.core), e = new THREE.Color(style.edge);
  for (let i = 0; i < 24; i++) {
    const a = Math.random() * Math.PI * 2;
    const k = Math.random() < 0.5 ? c : e;
    g.engine.glow.spawn({ x: at.x, y: at.y + 0.2, z: at.z, vx: Math.cos(a) * r * 5, vy: Math.random() * 3, vz: Math.sin(a) * r * 5, size: 0.14, sizeEnd: 0.02, life: 0.3, r: k.r, g: k.g, b: k.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 3 });
  }
  g.addRing(at.clone(), r * 3, style.edge, 0.35);
  void f;
}

/** RMB (standard): the concentrated blow — wound back low, driven through from the hip. */
class BlowAction extends SkillAction {
  readonly name = 'blow';
  private hits = new Set<number>();
  private charging = false;
  constructor(kit: YoruichiKit) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.fists(true);
    this.playClip(f, 'yr_blow', (n) => {
      if (n === 'charge') {
        this.charging = true;
        g.sfx.play('charge', f.center(), 0.6);
      }
      if (n === 'step') {
        this.charging = false;
        f.push.addScaledVector(f.forward(), 13);
        g.sfx.play('swingHeavy', f.center(), 1.2);
      }
      if (n !== 'hit') return;
      strike(this.kit, f, g, { damage: 42, knock: 26, launch: 5, heavy: true, reach: 1.1, height: 1.1, radius: 1.1, lunge: 0, limb: 'knuckle.R' }, this.hits);
      const k = sock(f, 'knuckle.R');
      const fw = f.forward(_w).clone();
      // the air ahead of the fist is driven out like a battering ram
      g.engine.destruction.carve(new ConeShape(k.clone(), fw, 0.4, 7), { mode: 'smash', power: 320, impulse: 14, dust: 0.6 });
      g.engine.glow.spawn({ x: k.x, y: k.y, z: k.z, size: 0.6, sizeEnd: 2.6, life: 0.16, r: 1, g: 0.95, b: 0.9, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * Math.PI * 2;
        g.engine.dust.spawn({ x: k.x, y: k.y, z: k.z, vx: fw.x * 16 + Math.cos(a) * 3, vy: Math.random() * 2, vz: fw.z * 16 + Math.sin(a) * 3, size: 0.5, sizeEnd: 2, life: 0.6, r: 0.88, g: 0.86, b: 0.84, alpha: 0.4, alphaEnd: 0, tex: TEX_PUFF, drag: 3 });
      }
      g.shake(f === g.player ? 0.35 : 0.12);
    });
  }
  override end(): void {
    this.kit.fists(false);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.charging) {
      const k = sock(f, 'knuckle.R');
      g.engine.glow.spawn({ x: k.x, y: k.y, z: k.z, size: 0.15 + this.t * 0.4, sizeEnd: 0.05, life: 0.07, r: 1, g: 0.9, b: 0.86, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
    }
  }
}

/** RMB (Shunkō): the Kidō fired out of the body through both palms, in a cone that tears up the ground. */
class BurstAction extends SkillAction {
  readonly name = 'burst';
  constructor(kit: YoruichiKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'yr_burst', (n) => {
      if (n === 'charge') {
        g.sfx.play('charge', f.center(), 0.8);
        this.kit.surge = 0.6;
      }
      if (n !== 'fire') return;
      const p = sock(f, 'palm.R').add(sock(f, 'palm.L')).multiplyScalar(0.5);
      const dir = aim(f, g).sub(p).setY(0).normalize();
      shunkoBurst(g, f, p, dir, 12, 70, this.kit.bolt());
      g.callout('瞬閧', 'SHUNKŌ', '#dbd9f0');
      f.push.addScaledVector(dir, -6);
    });
  }
}

/** Q: Utsusemi — the cast-off shell stays and takes the blow; she is already behind the target. */
class UtsusemiAction extends SkillAction {
  readonly name = 'utsusemi';
  private gone = false;
  constructor(kit: YoruichiKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0;
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'yr_vanish', (n) => {
      if (n === 'vanish') this.vanish(f, g);
    });
  }
  private vanish(f: Fighter, g: Game): void {
    if (this.gone) return;
    this.gone = true;
    const shell = new MirrorDecoy(g, f, 1.1, 'shell');
    g.addProjectile(shell);
    this.kit.lure(shell);
    const t = this.target && !this.target.dead ? this.target : null;
    const p = new THREE.Vector3();
    if (t) {
      const back = t.forward().multiplyScalar(-1);
      const go = clearance(g, t.pos, back, 1.3);
      p.copy(t.pos).addScaledVector(back, Math.max(0.7, go));
      f.yaw = Math.atan2(t.pos.x - p.x, t.pos.z - p.z);
    } else {
      const bk = f.forward(_w).multiplyScalar(-1);
      p.copy(f.pos).addScaledVector(bk, clearance(g, f.pos, bk, 6));
    }
    f.ghosts.spawn(0.35, 1);
    teleport(f, p);
    g.sfx.play('shunpo', f.center(), 0.8);
    g.callout('空蝉', 'UTSUSEMI', '#e6deff');
    // straight into the heel kick from behind
    this.done = true;
    this.kit.strikeNow('yr_spin');
  }
}

/** E: the Shunshin flurry — she strikes from every side at once, one blow per flash step. */
class FlurryAction extends SkillAction {
  readonly name = 'flurry';
  private n = 0;
  private next = 0;
  private hitAt = -1;
  private hits = new Set<number>();
  private clip = '';
  private readonly base = Math.random() * Math.PI * 2;
  constructor(kit: YoruichiKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0;
    this.invulnerable = true;
    this.trackTarget = false;
    this.airGravity = 0;
  }
  override start(f: Fighter, g: Game): void {
    this.dur = 99;
    g.callout('瞬神', 'SHUNSHIN', '#f3e9d8');
    this.flash(f, g);
  }
  private flash(f: Fighter, g: Game): void {
    const t = this.target;
    if (t.dead) {
      this.done = true;
      return;
    }
    const a = this.base + this.n * ((Math.PI * 4) / 5);
    const d = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
    const go = clearance(g, t.pos, d, 1.2);
    const p = t.pos.clone().addScaledVector(d, Math.max(0.6, go));
    p.y = t.pos.y + (this.n % 2) * 0.4;
    f.ghosts.spawn(0.3, 1);
    teleport(f, p);
    f.yaw = Math.atan2(t.pos.x - p.x, t.pos.z - p.z);
    this.clip = ['yr_strikeA', 'yr_strikeB', 'yr_strikeC'][this.n % 3];
    f.anim.play(this.clip, { fadeIn: 0.02 });
    this.hitAt = this.t + 0.07;
    this.hits.clear();
    this.next = this.t + 0.21;
    this.n++;
    g.sfx.play('shunpo', f.center(), 0.5);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.body.vel.set(0, 0, 0);
    if (this.hitAt >= 0 && this.t >= this.hitAt) {
      this.hitAt = -1;
      const last = this.n >= 5;
      const s = STRIKES[this.clip];
      strike(this.kit, f, g, last ? { ...s, damage: 22, knock: 18, launch: 8, heavy: true } : s, this.hits);
      if (last && this.kit.form !== 'standard') shunkoRing(g, f, this.target.pos.clone(), 2, this.kit.bolt());
    }
    if (this.t >= this.next) {
      if (this.n >= 5) this.done = true;
      else this.flash(f, g);
    }
  }
}

/** R: Raiōken — straight punches in a blur that hold the target up, and the final blow. */
class RaiokenAction extends SkillAction {
  readonly name = 'raioken';
  private struck = 0;
  constructor(kit: YoruichiKit) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    g.callout('雷王拳', 'RAIŌKEN', this.kit.form === 'raijin' ? '#f3ee51' : '#f3e9d8');
    this.kit.fists(true);
    this.playClip(f, 'yr_barrage', (n) => {
      if (n === 'step') f.push.addScaledVector(f.forward(), 8);
      if (n.startsWith('hit')) this.jab(f, g, Number(n.slice(3)));
      if (n === 'finish') this.finish(f, g);
    });
  }
  override end(): void {
    this.kit.fists(false);
  }
  private jab(f: Fighter, g: Game, i: number): void {
    const hand = i % 2 === 0 ? 'knuckle.L' : 'knuckle.R';
    const k = sock(f, hand);
    for (const o of g.enemiesOf(f)) {
      const cy = Math.max(o.pos.y + 0.2, Math.min(o.pos.y + o.def.height - 0.2, k.y));
      if (Math.hypot(o.pos.x - k.x, cy - k.y, o.pos.z - k.z) > 0.75 + o.def.radius) continue;
      g.damage(o, 5, f, f.forward(), { knock: 0.6, hitstop: 0.015, quiet: i % 3 !== 0 });
      o.hitstun = Math.max(o.hitstun, 0.3);
      this.struck++;
      this.kit.zap(o, new THREE.Vector3(o.pos.x, cy, o.pos.z));
    }
    g.engine.glow.spawn({ x: k.x, y: k.y, z: k.z, size: 0.3, sizeEnd: 0.8, life: 0.07, r: 1, g: 0.95, b: 0.9, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
    g.sfx.play('hit', k, 0.4);
  }
  private finish(f: Fighter, g: Game): void {
    const hits = strike(this.kit, f, g, { damage: 36, knock: 26, launch: 5, heavy: true, reach: 1.1, height: 1.15, radius: 1.1, lunge: 0, limb: 'knuckle.R' }, new Set());
    const k = sock(f, 'knuckle.R');
    const fw = f.forward(_w).clone();
    g.engine.destruction.carve(new ConeShape(k.clone(), fw, 0.5, this.kit.form === 'standard' ? 6 : 9), { mode: 'smash', power: this.kit.form === 'standard' ? 300 : 480, impulse: 16, dust: 0.6 });
    if (this.kit.form !== 'standard') shunkoBurst(g, f, k, fw, 7, 0, this.kit.bolt());
    g.hitstop(hits.length ? 0.1 : 0.03);
    g.shake(f === g.player ? 0.45 : 0.15);
  }
}

/** G (standard): Anken — five knives flicked off the toes of a rising kick. */
class AnkenAction extends SkillAction {
  readonly name = 'anken';
  constructor(kit: YoruichiKit) {
    super(kit);
    this.mobility = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'yr_anken', (n) => {
      if (n !== 'throw') return;
      const from = sock(f, 'toe.R');
      const dir = aim(f, g).sub(from).normalize();
      const side = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
      for (let i = -2; i <= 2; i++) g.addProjectile(new Kunai(f, g, from.clone().addScaledVector(side, i * 0.08), dir.clone().addScaledVector(side, i * 0.06).normalize(), 9));
      g.sfx.play('swing', from, 0.8);
    });
  }
}

/**
 * G (Shunkō): Hanki — a Kidō of her own, spun the other way, cancels whatever energy is coming at her.
 * Projectiles in front of her die; anyone close is frozen for a moment.
 */
class HankiAction extends SkillAction {
  readonly name = 'hanki';
  private blocking = false;
  constructor(kit: YoruichiKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.6;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'yr_hanki', (n) => {
      if (n === 'block') {
        this.blocking = true;
        g.callout('反鬼', 'HANKI', '#e6deff');
      }
      if (n === 'release') {
        this.blocking = false;
        for (const o of g.enemiesOf(f)) {
          if (o.pos.distanceTo(f.pos) > 6) continue;
          g.damage(o, 16, f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 6, hitstop: 0.06 });
          o.hitstun = Math.max(o.hitstun, 0.9);
          this.kit.zap(o, o.center());
        }
        shunkoRing(g, f, f.pos.clone(), 3, this.kit.bolt());
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.blocking) return;
    const fw = f.forward(_w);
    const c = f.center();
    // energy that reaches her is unspun and dies
    for (const p of g.projectiles as (Projectile & { pos?: THREE.Vector3; owner?: Fighter })[]) {
      if (p.done || !p.pos || p.owner === f || !(p.pos instanceof THREE.Vector3)) continue;
      const to = _v.subVectors(p.pos, c);
      const d = to.length();
      if (d > 5 || to.dot(fw) < -0.3 * d) continue;
      p.done = true;
      g.sparks(p.pos.clone(), fw.clone().negate(), '#E6DEFF', 10);
      g.sfx.play('ting', p.pos, 0.8);
    }
  }
}

/** F: Shunkō — the top torn away; the lightning floods her back and arms and bursts out. */
class ShunkoAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: YoruichiKit) {
    super(kit);
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'yr_shunko', (n) => {
      if (n === 'charge') {
        g.sfx.play('charge', f.center(), 1);
        f.aura.flare(1.2, 0.6);
      }
      if (n === 'tear') this.kit.becomeShunko();
      if (n === 'burst') {
        const p = f.pos.clone();
        for (const o of g.enemiesOf(f)) {
          if (o.pos.distanceTo(p) > 4.5) continue;
          g.damage(o, 30, f, o.pos.clone().sub(p).setY(0).normalize(), { knock: 18, launch: 4, heavy: true, hitstop: 0.08 });
          o.hitstun = Math.max(o.hitstun, 0.6);
        }
        shunkoRing(g, f, p, 4, BOLT_SHUNKO);
        g.engine.destruction.carve(new SphereShape(p.clone(), 3, 0.35), { mode: 'explode', power: 140, impulse: 10, dust: 0.5 });
        g.shake(f === g.player ? 0.5 : 0.2);
        g.sfx.play('explode', p, 1.2);
      }
    });
  }
}

/** F again: Raijin Senkei — the drums form on her back and the bangs stand up into horns. */
class RaijinAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: YoruichiKit) {
    super(kit);
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'yr_raijin', (n) => {
      if (n === 'drums') {
        this.kit.drumsUp = true;
        g.sfx.play('charge', f.center(), 1.3);
      }
      if (n === 'burst') this.kit.becomeRaijin();
    });
  }
}

/** Raijin RMB: the column of lightning brought down on the target. */
class ColumnAction extends SkillAction {
  readonly name = 'column';
  constructor(kit: YoruichiKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.6;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'yr_column', (n) => {
      if (n === 'charge') {
        g.sfx.play('charge', f.center(), 1.2);
        this.kit.surge = 1;
      }
      if (n !== 'fire') return;
      const at = this.target && !this.target.dead ? this.target.pos.clone() : aim(f, g);
      g.addProjectile(new ThunderColumn(g, f, at, 2.6, 0.55, 170));
      g.callout('雷神戦形', 'RAIJIN SENKEI', '#f3ee51');
    });
  }
}

/** Raijin Q: the drums throw their blinding light orbs. */
class OrbsAction extends SkillAction {
  readonly name = 'orbs';
  constructor(kit: YoruichiKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'yr_hanki', (n) => {
      if (n !== 'release') return;
      const back = sock(f, 'back');
      const fw = f.forward(_w).clone();
      const side = new THREE.Vector3(-fw.z, 0, fw.x);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        const from = back.clone().addScaledVector(side, Math.cos(a) * 0.9).add(new THREE.Vector3(0, 0.25 + Math.sin(a) * 0.9, 0)).addScaledVector(fw, -0.4);
        const dir = fw.clone().addScaledVector(side, Math.cos(a) * 0.5).add(new THREE.Vector3(0, 0.4 + Math.sin(a) * 0.3, 0));
        g.addProjectile(new BlindOrb(f, from, this.target, dir, 18));
      }
      g.sfx.play('beam', back, 0.6);
    }, 1.2);
  }
}

// ------------------------------------------------------------------ the kit

export class YoruichiKit implements Kit {
  form: Form = 'standard';
  flare = false;
  comboIndex = 0;
  raijinT = 0;
  /** a burst of lightning before a big technique (eases back to 0) */
  surge = 0;
  drumsUp = false;
  readonly field: ShunkoField;
  readonly drums: DrumRing;
  private lastEnd = 0;
  private lureT = 0;
  private ghostT = 0;
  private cd = { heavy: 0, utsusemi: 0, flurry: 0, raioken: 0, anken: 0, hanki: 0, orbs: 0, raijin: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    this.setHands();
    this.field = new ShunkoField(g, f, BOLT_SHUNKO);
    this.drums = new DrumRing(g, f);
    g.addProjectile(this.field);
    g.addProjectile(this.drums);
    this.applyStats();
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    this.surge = Math.max(0, this.surge - dt * 1.5);
    // the lightning: steady in Shunkō, flaring when she attacks
    const lit = this.form !== 'standard' && !f.dead;
    const want = lit ? Math.min(1, 0.65 + (f.action ? 0.25 : 0) + this.surge) : 0;
    this.field.level += (want - this.field.level) * Math.min(1, dt * 8);
    this.field.legs = this.form === 'raijin';
    const dw = (this.form === 'raijin' || this.drumsUp) && !f.dead ? 1 : 0;
    this.drums.level += (dw - this.drums.level) * Math.min(1, dt * 4);
    if (this.lureT > 0) {
      this.lureT -= dt;
      if (this.lureT <= 0) f.lure = null;
    }
    // the Flash Goddess leaves a trail of afterimages
    if (f.dashT > 0) {
      this.ghostT -= dt;
      if (this.ghostT <= 0) {
        this.ghostT = 0.025;
        f.ghosts.spawn(0.28, 0.9);
      }
    }
    if (this.form === 'raijin') {
      this.raijinT -= dt;
      if (this.raijinT <= 0 && !f.busy) this.endRaijin();
    }
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 60, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 60);
  }

  private near(range: number): Fighter | null {
    const t = this.target();
    return t && t.pos.distanceTo(this.f.pos) <= range ? t : null;
  }

  private setHands(): void {
    this.fists(false);
  }

  /** Fists for the punches, open hands for everything else. */
  fists(on: boolean): void {
    const rig = this.f.visual.rig;
    rig.setBoneVisible('fist.R', on);
    rig.setBoneVisible('fist.L', on);
    rig.setBoneVisible('palm.R', !on);
    rig.setBoneVisible('palm.L', !on);
  }

  bolt(): BoltStyle {
    return this.form === 'raijin' ? BOLT_RAIJIN : BOLT_SHUNKO;
  }

  /** A blow landed in Shunkō: the lightning goes into the target and stops it dead. */
  zap(o: Fighter, at: THREE.Vector3): void {
    if (this.form === 'standard' || o.dead) return;
    o.hitstun = Math.max(o.hitstun, this.form === 'raijin' ? 0.35 : 0.26);
    const st = this.bolt();
    const c = new THREE.Color(st.core), e = new THREE.Color(st.edge);
    for (let i = 0; i < 8; i++) {
      const k = Math.random() < 0.5 ? c : e;
      g_spawnStreak(this.g, at, k);
    }
    this.surge = Math.max(this.surge, 0.3);
  }

  /** The striking limb's streak through the air. */
  limbTrail(p: THREE.Vector3): void {
    const st = this.form === 'standard' ? null : this.bolt();
    const c = st ? new THREE.Color(st.edge) : new THREE.Color('#F3E9D8');
    this.g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.16, sizeEnd: 0.03, life: 0.12, r: c.r, g: c.g, b: c.b, alpha: st ? 0.9 : 0.45, alphaEnd: 0, tex: TEX_GLOW });
  }

  /** Utsusemi's shell: enemies go for it while it stands. */
  lure(shell: MirrorDecoy): void {
    this.f.lure = shell.pos;
    this.lureT = 0.9;
  }

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof StrikeAction && cur.chained) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const idx = i % YORUICHI_CHAIN.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.7;
    this.f.act(new StrikeAction(this, YORUICHI_CHAIN[idx], idx), true);
  }

  /** A single strike out of another technique (Utsusemi's heel kick from behind). */
  strikeNow(clip: string): void {
    this.f.act(new StrikeAction(this, clip, 0, false), true);
  }

  private special(a: SkillAction, cost: number, cdKey: keyof typeof this.cd, cd: number): boolean {
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

  /** RMB: the concentrated blow / the Shunkō burst / the column. */
  heavy(): void {
    const f = this.f;
    if (f.busy && !(f.action instanceof StrikeAction)) return;
    if (this.form === 'raijin') this.special(new ColumnAction(this, this.near(45)), 24, 'heavy', 4);
    else if (this.form === 'shunko') this.special(new BurstAction(this), 16, 'heavy', 2.6);
    else this.special(new BlowAction(this), 8, 'heavy', 2.2);
  }

  /** Q: Utsusemi / (Raijin) the blinding orbs. */
  skill1(): void {
    if (this.form === 'raijin') this.special(new OrbsAction(this, this.near(40)), 18, 'orbs', 5);
    else this.special(new UtsusemiAction(this, this.near(14)), 10, 'utsusemi', 4);
  }

  /** E: the Shunshin flurry. */
  skill2(): void {
    const t = this.near(18);
    if (!t) {
      if (this.f === this.g.player) this.g.hud?.showBanner('No one in reach');
      return;
    }
    this.special(new FlurryAction(this, t), this.form === 'standard' ? 16 : 20, 'flurry', 6);
  }

  /** R: Raiōken. */
  skill3(): void {
    this.special(new RaiokenAction(this), this.form === 'standard' ? 18 : 24, 'raioken', 5);
  }

  /** G: Anken / (Shunkō) Hanki. */
  toggle(): void {
    if (this.form === 'standard') this.special(new AnkenAction(this), 6, 'anken', 2.5);
    else this.special(new HankiAction(this), 14, 'hanki', 6);
  }

  release(): void {
    const f = this.f;
    if (f.busy || this.form === 'raijin') return;
    if (this.form === 'shunko' && this.cd.raijin > 0) {
      if (f === this.g.player) this.g.hud?.showBanner('The drums are still silent');
      return;
    }
    if (!f.spendRei(this.form === 'standard' ? 25 : 55)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(this.form === 'standard' ? new ShunkoAction(this) : new RaijinAction(this), true);
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

  becomeShunko(): void {
    const { f, g } = this;
    if (this.form !== 'standard') return;
    this.form = 'shunko';
    f.def = { ...f.def, speed: { ...SPEED_SHUNKO } };
    f.setForm({ asset: yoruichiAsset('shunko'), props: [] }, AURA_SHUNKO);
    this.setHands();
    // the orange top torn away in shreds
    const c = f.center();
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.dust.spawn({ x: c.x, y: c.y + 0.2, z: c.z, vx: Math.cos(a) * 4, vy: 1 + Math.random() * 3, vz: Math.sin(a) * 4, size: 0.12, sizeEnd: 0.08, life: 1.1, r: 0.86, g: 0.47, b: 0.23, alpha: 0.95, alphaEnd: 0, tex: TEX_PUFF, gravity: -6, drag: 1.5, spin: (Math.random() - 0.5) * 8 });
    }
    this.field.setStyle(BOLT_SHUNKO);
    this.field.level = 1;
    f.aura.flare(1.8, 0.8);
    g.addRing(f.pos.clone(), 12, '#DBD9F0', 0.5);
    g.sfx.play('bankai', c, 0.8);
    g.callout('瞬閧', 'SHUNKŌ', '#dbd9f0');
    this.applyStats();
  }

  becomeRaijin(): void {
    const { f, g } = this;
    if (this.form !== 'shunko') return;
    this.form = 'raijin';
    this.raijinT = RAIJIN_TIME;
    this.drumsUp = false;
    f.setForm({ asset: yoruichiAsset('raijin'), props: [] }, AURA_RAIJIN);
    this.setHands();
    this.field.setStyle(BOLT_RAIJIN);
    this.drums.level = 1;
    f.aura.pillarBurst(2.4);
    f.aura.flare(2.2, 1.1);
    g.addRing(f.pos.clone(), 16, '#F3EE51', 0.6);
    g.sfx.play('bankai', f.center());
    g.shake(f === g.player ? 0.6 : 0.2);
    g.slowMo(0.35, 0.4);
    g.engine.gr.chroma.offset.set(0.005, 0.005);
    // lightning wings flare from her back as it takes
    const back = sock(f, 'back');
    const side = new THREE.Vector3(-f.forward(_w).z, 0, f.forward(_w).x);
    for (const k of [-1, 1])
      for (let i = 0; i < 18; i++) {
        const t = i / 17;
        g.engine.glow.spawn({ x: back.x + side.x * k * t * 3.2, y: back.y + 0.3 + Math.sin(t * Math.PI) * 1.2 + t * 0.8, z: back.z + side.z * k * t * 3.2, size: 0.5 - t * 0.25, sizeEnd: 0.05, life: 0.6, r: 1, g: 0.9, b: 0.45, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
      }
    g.callout('瞬閧・雷神戦形', 'SHUNKŌ — RAIJIN SENKEI', '#f3ee51');
    this.applyStats();
  }

  private endRaijin(): void {
    const { f, g } = this;
    this.form = 'shunko';
    this.cd.raijin = 25;
    f.setForm({ asset: yoruichiAsset('shunko'), props: [] }, AURA_SHUNKO);
    this.setHands();
    this.field.setStyle(BOLT_SHUNKO);
    g.sfx.play('crack', f.center(), 0.8);
    if (f === g.player) g.hud?.showBanner('The drums fall silent');
    this.applyStats();
  }

  private applyStats(): void {
    const f = this.f;
    const fm = this.form;
    f.power = (fm === 'raijin' ? 1.55 : fm === 'shunko' ? 1.3 : 1) * (this.flare ? 1.25 : 1);
    f.damageTaken = fm === 'raijin' ? 0.85 : fm === 'shunko' ? 0.9 : 1;
    // without Shunkō hard skin hurts her more than it; with it, weak blows break on the lightning
    f.toughness = fm === 'raijin' ? 7 : fm === 'shunko' ? 4 : 0;
    f.aura.target = this.flare ? 0.9 : fm === 'raijin' ? 0.55 : fm === 'shunko' ? 0.28 : 0.05;
  }

  formName(): string {
    if (this.form === 'raijin') return `Shunkō — Raijin Senkei · ${Math.max(0, Math.ceil(this.raijinT))} s`;
    return this.form === 'shunko' ? 'Shunkō' : 'Flash Goddess';
  }

  ai(): KitAI {
    return {
      reach: 1.6,
      chain: 5,
      releaseAt: [0.8, 0.45],
      moves: [
        { name: 'utsusemi', use: () => this.skill1(), min: 0, max: 5, weight: 1.3, cd: 5, when: () => this.form !== 'raijin' },
        { name: 'flurry', use: () => this.skill2(), min: 2, max: 16, weight: 1.6, cd: 6 },
        { name: 'raioken', use: () => this.skill3(), min: 0, max: 2.4, weight: 1.4, cd: 5 },
        { name: 'blow', use: () => this.heavy(), min: 0, max: 2.6, weight: 1.1, cd: 3, when: () => this.form === 'standard' },
        { name: 'anken', use: () => this.toggle(), min: 4, max: 22, weight: 1.2, cd: 4, when: () => this.form === 'standard' },
        { name: 'burst', use: () => this.heavy(), min: 1.5, max: 11, weight: 1.6, cd: 4, when: () => this.form === 'shunko' },
        { name: 'hanki', use: () => this.toggle(), min: 2, max: 12, weight: 0.8, cd: 7, when: () => this.form !== 'standard' },
        { name: 'column', use: () => this.heavy(), min: 3, max: 40, weight: 2.4, cd: 5, when: () => this.form === 'raijin' },
        { name: 'orbs', use: () => this.skill1(), min: 4, max: 30, weight: 1.3, cd: 5, when: () => this.form === 'raijin' },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const fm = this.form, cd = this.cd;
    const list: AbilityInfo[] = [{ key: 'LMB', name: 'Hakuda', kanji: '白打' }];
    if (fm === 'raijin') {
      list.push(
        { key: 'RMB', name: 'Lightning column', kanji: '雷柱', cost: 24, cd: cd.heavy, cdMax: 4 },
        { key: 'Q', name: 'Light orbs', kanji: '光球', cost: 18, cd: cd.orbs, cdMax: 5 },
      );
    } else {
      list.push(
        fm === 'shunko' ? { key: 'RMB', name: 'Shunkō burst', kanji: '瞬閧', cost: 16, cd: cd.heavy, cdMax: 2.6 } : { key: 'RMB', name: 'Concentrated blow', kanji: '撃', cost: 8, cd: cd.heavy, cdMax: 2.2 },
        { key: 'Q', name: 'Utsusemi', kanji: '空蝉', cost: 10, cd: cd.utsusemi, cdMax: 4 },
      );
    }
    list.push(
      { key: 'E', name: 'Shunshin flurry', kanji: '瞬神', cost: fm === 'standard' ? 16 : 20, cd: cd.flurry, cdMax: 6 },
      { key: 'R', name: 'Raiōken', kanji: '雷王拳', cost: fm === 'standard' ? 18 : 24, cd: cd.raioken, cdMax: 5 },
      fm === 'standard' ? { key: 'G', name: 'Anken', kanji: '暗剣', cost: 6, cd: cd.anken, cdMax: 2.5 } : { key: 'G', name: 'Hanki', kanji: '反鬼', cost: 14, cd: cd.hanki, cdMax: 6 },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      fm === 'raijin' ? { key: 'F', name: 'Raijin Senkei', kanji: '雷神', active: true, timer: this.raijinT / RAIJIN_TIME, tint: '#f3ee51' } : { key: 'F', name: fm === 'standard' ? 'Shunkō' : 'Raijin Senkei', kanji: fm === 'standard' ? '瞬閧' : '雷神', cost: fm === 'standard' ? 25 : 55, cd: fm === 'shunko' ? cd.raijin : 0, cdMax: 25, tint: fm === 'standard' ? '#dbd9f0' : '#f3ee51' },
    );
    return list;
  }
}

function g_spawnStreak(g: Game, at: THREE.Vector3, c: THREE.Color): void {
  const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.3) * 2;
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, vx: Math.cos(a) * 6, vy: e * 3, vz: Math.sin(a) * 6, size: 0.1, sizeEnd: 0.02, life: 0.22, r: c.r, g: c.g, b: c.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 3 });
}
