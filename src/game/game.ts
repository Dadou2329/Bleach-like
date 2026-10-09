// Game session: fighters, projectiles, effects, camera, HUD and the combat services every kit uses
// (blade sweeps that hit fighters and cut the world, damage/knockback, hitstop, shake, callouts,
// wall slams that smash buildings).
import * as THREE from 'three';
import type { Engine } from '../engine';
import { Fighter, type BladeSpec, type FighterDef } from './fighter';
import { ActionCamera } from './camera';
import { Input } from './input';
import { BoxShape, SphereShape } from '../destruction/shapes';
import { raycastVoxels } from '../voxel/raycast';
import { ShockRing } from '../vfx/energy';
import { TEX_GLOW, TEX_PUFF, TEX_RING, TEX_STREAK } from '../vfx/sprites';
import type { Hud } from '../ui/hud';
import { Sfx } from '../audio/sfx';

/** how close a veiled fighter (reiatsu on a higher plane) must be before it can be sensed (m) */
export const VEIL_RANGE = 8;

export interface Projectile {
  done: boolean;
  update(dt: number, g: Game): void;
  render?(dt: number, time: number): void;
  dispose(): void;
  /**
   * A rejection (Orihime's "I reject"): an enemy shot touching the sphere undoes itself (and an enemy field
   * too, when `fields`). Returns true when it was rejected.
   */
  reject?(at: THREE.Vector3, radius: number, by: Fighter, fields: boolean): boolean;
}

export interface Controller {
  /** the fighter this controller drives (removed together with it) */
  readonly f?: Fighter;
  update(dt: number): void;
  render?(dt: number): void;
}

export interface DamageOpts {
  knock?: number;
  launch?: number;
  heavy?: boolean;
  hitstop?: number;
  shake?: number;
  color?: THREE.ColorRepresentation;
  /** rapid small ticks (blade swarms, beams): no hit sound, hitstop, shake or number */
  quiet?: boolean;
  /** a reishi attack (Cero, Getsuga, Kidō, arrows, flames) rather than a blade or a fist */
  energy?: boolean;
  /** a feint or a blow round the guard: parries, catches and counter stances do not stop it */
  unblockable?: boolean;
  /**
   * the wound is this fighter's own power turned back on it (Freund Schild, Sōgyo no Kotowari, Shiten Kōshun): it lands
   * even through intangibility
   */
  reflected?: Fighter | null;
}

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _qa = new THREE.Quaternion();
const _qb = new THREE.Quaternion();
const _m = new THREE.Matrix4();

export class Game {
  readonly fighters: Fighter[] = [];
  readonly projectiles: Projectile[] = [];
  readonly rings: ShockRing[] = [];
  readonly controllers: Controller[] = [];
  readonly input: Input;
  readonly cam: ActionCamera;
  player: Fighter | null = null;
  hud: Hud | null = null;
  time = 0;
  slowmo = 0;
  private slowmoScale = 1;
  /** extra damage multiplier for the player (difficulty) */
  playerPower = 1;
  readonly sfx = new Sfx();

  constructor(readonly engine: Engine) {
    this.input = new Input(engine.gr.renderer.domElement);
    this.cam = new ActionCamera(engine.gr.camera, engine.world);
    engine.systems.push({ update: (dt) => this.update(dt) });
    const unlock = () => this.sfx.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    engine.destruction.onCarve = (c, n, mode) => {
      if (n > 40) this.sfx.play(mode === 'cut' ? 'crumble' : n > 3000 ? 'impact' : 'crumble', c, Math.min(2, 0.4 + n / 1500));
    };
    // rubble never settles inside a fighter
    engine.debris.depositBlocked = (x, y, z) => {
      for (const f of this.fighters) {
        const p = f.body.pos;
        const r = f.def.radius + 0.25;
        if (Math.abs(x - p.x) < r && Math.abs(z - p.z) < r && y > p.y - 0.2 && y < p.y + f.def.height) return true;
      }
      return false;
    };
    engine.renderHooks.push((dt, alpha) => this.render(dt, alpha));
  }

  spawn(def: FighterDef, pos: THREE.Vector3, team: number): Fighter {
    const f = new Fighter(def, this, team, pos);
    this.fighters.push(f);
    return f;
  }

  remove(f: Fighter): void {
    const i = this.fighters.indexOf(f);
    if (i >= 0) this.fighters.splice(i, 1);
    for (let k = this.controllers.length - 1; k >= 0; k--) if (this.controllers[k].f === f) this.controllers.splice(k, 1);
    if (this.player === f) this.player = null;
    if (this.hud?.rival === f) this.hud.rival = null;
    f.dispose();
  }

  addProjectile(p: Projectile): void {
    this.projectiles.push(p);
  }

  /** "I reject": every enemy shot (and field, when `fields`) touching the sphere is undone; returns how many */
  rejectNear(at: THREE.Vector3, radius: number, by: Fighter, fields = true): number {
    let n = 0;
    for (const p of this.projectiles) if (!p.done && p.reject?.(at, radius, by, fields)) n++;
    return n;
  }

  addRing(pos: THREE.Vector3, r: number, color: THREE.ColorRepresentation, dur = 0.45): void {
    const ring = new ShockRing(pos, r, color, dur);
    this.engine.gr.scene.add(ring.mesh);
    this.rings.push(ring);
  }

  // ------------------------------------------------------------------ feedback

  hitstop(s: number): void {
    this.engine.hitstop = Math.max(this.engine.hitstop, s);
  }

  shake(a: number): void {
    this.cam.addTrauma(a);
  }

  /** Brief slow motion (finishers, big releases). */
  slowMo(seconds: number, scale = 0.25): void {
    this.slowmo = Math.max(this.slowmo, seconds);
    this.slowmoScale = scale;
  }

  callout(kanji: string, romaji: string, color = '#ffffff'): void {
    this.hud?.callout(kanji, romaji, color);
  }

  // ------------------------------------------------------------------ queries

  enemiesOf(f: Fighter): Fighter[] {
    // friend and foe reversed (Happōfusagari): its own side are the enemies now, for targeting and for blows
    if (f.iffT > 0) return this.fighters.filter((o) => o !== f && !o.dead && o.team === f.team);
    return this.fighters.filter((o) => o !== f && !o.dead && o.team !== f.team);
  }

  /** Nearest enemy within range, optionally inside a cone around dir (degrees). */
  nearestEnemy(f: Fighter, range: number, dir?: THREE.Vector3, coneDeg = 180): Fighter | null {
    // a veiled fighter (reiatsu on a higher plane) cannot be sensed beyond VEIL_RANGE
    // blinded: it senses no one (its kit's skills fly straight ahead); inverted: what it senses is a mirror
    // image (the duel AI aims at that; skills fly where it faces)
    if (f.blindT > 0 || f.invertT > 0) return null;
    let best: Fighter | null = null, bd = Infinity;
    const cosC = Math.cos((coneDeg * Math.PI) / 180);
    for (const o of this.enemiesOf(f)) {
      _v.subVectors(o.pos, f.pos);
      const d = _v.length();
      if (d > range || (o.veiled && d > VEIL_RANGE)) continue;
      if (dir && d > 0.5) {
        _v.y = 0;
        if (_v.normalize().dot(dir) < cosC) continue;
      }
      // prefer what is in front
      const score = d * (dir ? 1.6 - _v.dot(dir) * 0.6 : 1);
      if (score < bd) { bd = score; best = o; }
    }
    return best;
  }

  /**
   * Third-person aim: what the camera centre looks at (enemies first, then voxels), else far along
   * the view ray. Projectiles fly from the fighter to this point.
   */
  aimPoint(from: Fighter, out = new THREE.Vector3()): THREE.Vector3 {
    if (this.cam.override) return out.copy(from.center()).addScaledVector(from.forward(), 60);
    const cam = this.engine.gr.camera;
    const o = cam.position;
    const d = cam.getWorldDirection(new THREE.Vector3());
    let best = 220;
    // enemies: ray vs vertical capsule (sampled)
    for (const e of this.enemiesOf(from)) {
      const c = e.center();
      const t = _v.subVectors(c, o).dot(d);
      if (t < 0 || t > best) continue;
      const px = o.x + d.x * t - c.x, pz = o.z + d.z * t - c.z;
      const py = o.y + d.y * t;
      if (px * px + pz * pz < (e.def.radius + 0.5) ** 2 && py > e.pos.y - 0.3 && py < e.pos.y + e.def.height + 0.3) best = t;
    }
    const hit = raycastVoxels(this.engine.world, o.x, o.y, o.z, d.x, d.y, d.z, best);
    if (hit && hit.dist < best) best = hit.dist;
    // never aim at something between the camera and the fighter
    const fc = from.center();
    const along = _w.subVectors(fc, o).dot(d);
    if (best < along + 1) best = along + 40;
    return out.copy(o).addScaledVector(d, best);
  }

  // ------------------------------------------------------------------ combat

  /**
   * Blade swept from (pb, pt) to (cb, ct) this frame: hit enemies along the blade and cut the world
   * where the blade passed.
   */
  bladeSweep(f: Fighter, pb: THREE.Vector3, pt: THREE.Vector3, cb: THREE.Vector3, ct: THREE.Vector3, spec: BladeSpec, hits: Set<number> = f.bladeHits): void {
    // ---- fighters
    // Between the two samples the blade turns about its base (snapping strikes can cover well over 90°
    // in a frame, and a straight chord between the tips would cut through the wielder instead of the arc
    // in front); the base itself moves straight.
    const d0 = _a.subVectors(pt, pb), d1 = _b.subVectors(ct, cb);
    const l0 = d0.length(), l1 = d1.length();
    d0.divideScalar(l0 || 1);
    d1.divideScalar(l1 || 1);
    const turn = Math.acos(Math.max(-1, Math.min(1, d0.dot(d1))));
    const steps = Math.min(12, Math.max(3, Math.ceil(turn / 0.26)));
    _qa.setFromUnitVectors(d0, d1);
    const reach = spec.reach ?? 0.18;
    for (const o of this.enemiesOf(f)) {
      if (hits.has(o.id)) continue;
      let hit = false;
      let hitY = 0;
      const bottom = o.pos.y + 0.1, top = o.pos.y + o.def.height;
      for (let si = 0; si <= steps && !hit; si++) {
        const k = si / steps;
        _qb.identity().slerp(_qa, k);
        const dir = _c.copy(d0).applyQuaternion(_qb);
        const len = l0 + (l1 - l0) * k;
        const bx = pb.x + (cb.x - pb.x) * k, by = pb.y + (cb.y - pb.y) * k, bz = pb.z + (cb.z - pb.z) * k;
        for (let bi = 0; bi <= 6 && !hit; bi++) {
          const u = (bi / 6) * len;
          // a point on the swept blade
          const x = bx + dir.x * u, y = by + dir.y * u, z = bz + dir.z * u;
          const cy = Math.max(bottom, Math.min(top, y));
          const dx = x - o.pos.x, dy = y - cy, dz = z - o.pos.z;
          if (dx * dx + dy * dy + dz * dz < (o.def.radius + reach) ** 2) { hit = true; hitY = y; }
        }
      }
      if (hit) {
        hits.add(o.id);
        _v.subVectors(ct, pt);
        _v.y *= 0.3;
        if (_v.lengthSq() < 1e-4) f.forward(_v);
        _v.normalize();
        // knock mostly away from the attacker, flavoured by the swing direction
        _w.subVectors(o.pos, f.pos).setY(0).normalize().multiplyScalar(0.6).add(_v.multiplyScalar(0.4)).normalize();
        const weak = o.def.weakAbove !== undefined && hitY > o.pos.y + o.def.height * o.def.weakAbove ? 3 : 1;
        this.damage(o, spec.damage * weak, f, _w, { knock: spec.knock, launch: spec.launch, heavy: spec.heavy || weak > 1, hitstop: spec.hitstop, shake: spec.shake, unblockable: spec.unblockable });
        this.sparks(o.center(), _w, f.def.aura.body);
        spec.onHit?.(o);
      }
    }
    // ---- world: thin box spanning the swept region
    if (spec.cut > 0) {
      const mb = _v.addVectors(pb, cb).multiplyScalar(0.5);
      const mt = _w.addVectors(pt, ct).multiplyScalar(0.5);
      const bladeDir = new THREE.Vector3().subVectors(mt, mb);
      const len = bladeDir.length();
      if (len < 0.05) return;
      bladeDir.divideScalar(len);
      const midPrev = new THREE.Vector3().addVectors(pb, pt).multiplyScalar(0.5);
      const midCur = new THREE.Vector3().addVectors(cb, ct).multiplyScalar(0.5);
      const sweep = new THREE.Vector3().subVectors(ct, pt);
      sweep.addScaledVector(bladeDir, -sweep.dot(bladeDir));
      const sl = sweep.length();
      if (sl < 0.02) return;
      sweep.divideScalar(sl);
      const nrm = new THREE.Vector3().crossVectors(sweep, bladeDir).normalize();
      _m.makeBasis(bladeDir, nrm, sweep);
      _q.setFromRotationMatrix(_m);
      const center = new THREE.Vector3().addVectors(midPrev, midCur).multiplyScalar(0.5);
      center.addScaledVector(bladeDir, 0.08);
      const shape = new BoxShape(center, new THREE.Vector3(len * 0.55 + 0.1, spec.thick ?? 0.07, sl * 0.5 + 0.08), _q.clone());
      const r = this.engine.destruction.carve(shape, { mode: 'cut', power: spec.cut, dir: sweep.clone(), sparks: [0.7, 0.85, 1], dust: 0.6 });
      if (r.removed > 0 && f === this.player) this.shake(Math.min(0.12, r.removed / 4000));
    }
  }

  /** Apply damage + reaction. */
  damage(t: Fighter, amount: number, from: Fighter | null, dir: THREE.Vector3, o: DamageOpts = {}): void {
    if (t.dead || t.invuln > 0) return;
    if (t.action?.invulnerable) return;
    if (t.intangible && o.reflected !== t) {
      t.onPhase?.(amount, from, o);
      return;
    }
    if (!o.unblockable && t.parry?.(amount, from, o)) return;
    const armor = t.action?.armor ?? 0;
    const power = from ? from.power * (from === this.player ? this.playerPower : 1) * (1 - from.sealK) : 1;
    let dmg = amount * power * (1 - armor) * t.damageTaken * (o.energy ? t.energyTaken : 1) * (t.agedT > 0 ? 1 + t.agedK : 1);
    // reiatsu armour: a weak cut bounces off (Ichigo's hands bled on Kenpachi's skin)
    const shrug = t.toughness > 0 && dmg < t.toughness;
    if (shrug) dmg *= 0.25;
    t.hp -= dmg;
    t.flashT = 0.12;
    t.lastHurt.at = this.time;
    t.lastHurt.dmg = dmg;
    t.lastHurt.shrug = shrug;
    t.lastHurt.from = from;
    t.lastHurt.reflected = o.reflected === t;
    if (from) from.stats.damageDealt += dmg;
    if (this.hud && !o.quiet) {
      const toPlayer = t === this.player, byPlayer = from !== null && from === this.player;
      this.hud.damageNumber(t.center(), dmg, toPlayer ? '#ff6b6b' : o.heavy ? '#ffe066' : '#ffffff', byPlayer);
    }
    // a weighted body (Wabisuke) is hard to move
    const heavy = 1 / (1 + 0.3 * t.heavyB);
    const knock = (o.knock ?? 3) * (1 - armor) * t.knockTaken * (t.def.boss ? 0.02 : 1) * (shrug ? 0.15 : 1) * heavy;
    t.push.x += dir.x * knock;
    t.push.z += dir.z * knock;
    if (o.launch && !t.def.boss) {
      t.body.vel.y = Math.max(t.body.vel.y, o.launch / (1 + 0.5 * t.heavyB));
      t.hovering = false;
    }
    // flinch: pitch away from the hit
    const local = _v.copy(dir).applyAxisAngle(new THREE.Vector3(0, 1, 0), -t.yaw);
    t.anim.flinch(-local.z * 260, local.x * 200);
    if (shrug && !o.quiet) {
      // sparks off the skin instead of a stagger
      const c = t.center();
      for (let i = 0; i < 8; i++)
        this.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: -dir.x * 4 + (Math.random() - 0.5) * 6, vy: Math.random() * 4, vz: -dir.z * 4 + (Math.random() - 0.5) * 6, size: 0.1, sizeEnd: 0.02, life: 0.25, r: 1, g: 0.85, b: 0.4, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2.5, gravity: -8 });
    }
    if (armor < 0.5 && !shrug && !(t.def.boss && !o.heavy)) {
      if (o.heavy) {
        t.stopAction();
        t.hitstun = Math.max(t.hitstun, 0.55);
        t.anim.play('hit_heavy', { fadeIn: 0.03 });
      } else {
        t.hitstun = Math.max(t.hitstun, o.quiet ? 0.08 : 0.22);
      }
    }
    const isPlayer = from === this.player || t === this.player;
    if (!o.quiet) {
      this.sfx.play(o.heavy ? 'hitHeavy' : 'hit', t.center(), t.def.boss ? 1.4 : 1);
      this.hitstop(o.hitstop ?? (o.heavy ? 0.09 : 0.05));
      if (isPlayer) this.shake(o.shake ?? (o.heavy ? 0.35 : 0.15));
    } else if (Math.random() < 0.3) this.sfx.play('hit', t.center(), 0.35);
    t.onHurt?.(dmg, o.heavy === true);
    if (t.hp <= 0 && t.immortal) t.hp = 1;
    else if (t.hp <= 0 && !(t.onLethal?.() ?? false)) this.kill(t, from, dir);
  }

  /** Damage over time (rot, poison, burns): the HP drains without a flinch, hitstun, sound or number; it can still kill. */
  drain(t: Fighter, amount: number, from: Fighter | null): void {
    if (t.dead || t.invuln > 0 || amount <= 0 || t.intangible) return;
    const power = from ? from.power * (from === this.player ? this.playerPower : 1) : 1;
    const dmg = amount * power * t.damageTaken;
    t.hp -= dmg;
    if (from) from.stats.damageDealt += dmg;
    if (t.hp <= 0 && t.immortal) t.hp = 1;
    else if (t.hp <= 0 && !(t.onLethal?.() ?? false)) this.kill(t, from, _w.set(0, 0, 0));
  }

  kill(t: Fighter, from: Fighter | null, dir: THREE.Vector3): void {
    t.hp = 0;
    t.dead = true;
    t.stopAction();
    t.aura.target = 0;
    t.push.x += dir.x * 8;
    t.push.z += dir.z * 8;
    t.body.vel.y = Math.max(t.body.vel.y, 5);
    if (from) from.stats.kills++;
    this.hud?.onKill(t);
    this.sfx.play('purify', t.center(), t.def.boss ? 2 : 1);
    if (from === this.player) this.slowMo(0.18, 0.45);
    // purification: the body dissolves into pale reishi motes
    const c = t.center();
    const glow = this.engine.glow;
    for (let i = 0; i < 70; i++) {
      const h = t.def.height;
      glow.spawn({
        x: c.x + (Math.random() - 0.5) * t.def.radius * 2, y: t.pos.y + Math.random() * h, z: c.z + (Math.random() - 0.5) * t.def.radius * 2,
        vx: (Math.random() - 0.5) * 0.8, vy: 0.6 + Math.random() * 1.8, vz: (Math.random() - 0.5) * 0.8,
        size: 0.08 + Math.random() * 0.14, sizeEnd: 0.02, life: 1.4 + Math.random() * 1.6,
        r: 0.81, g: 0.91, b: 1, alpha: 0.95, alphaEnd: 0, tex: TEX_GLOW, drag: 0.3, gravity: 0.4,
      });
    }
  }

  sparks(p: THREE.Vector3, dir: THREE.Vector3, color: THREE.ColorRepresentation, n = 16): void {
    const c = new THREE.Color(color);
    const glow = this.engine.glow;
    for (let i = 0; i < n; i++) {
      const s = 4 + Math.random() * 10;
      const vx = dir.x * s + (Math.random() - 0.5) * 7, vy = dir.y * s + (Math.random() - 0.2) * 6, vz = dir.z * s + (Math.random() - 0.5) * 7;
      glow.spawn({ x: p.x, y: p.y, z: p.z, vx, vy, vz, size: 0.12 + Math.random() * 0.12, sizeEnd: 0.02, life: 0.18 + Math.random() * 0.25, r: 1, g: 0.95, b: 0.85, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 2, gravity: -6 });
    }
    glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.5, sizeEnd: 1.6, life: 0.16, r: c.r, g: c.g, b: c.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.3, sizeEnd: 2.2, life: 0.22, r: 1, g: 1, b: 1, alpha: 0.7, alphaEnd: 0, tex: TEX_RING });
    // blood-mist (kept subtle)
    for (let i = 0; i < 5; i++)
      this.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: dir.x * 3 + (Math.random() - 0.5) * 2, vy: Math.random() * 2, vz: dir.z * 3 + (Math.random() - 0.5) * 2, size: 0.15, sizeEnd: 0.35, life: 0.35, r: 0.45, g: 0.04, b: 0.05, alpha: 0.6, alphaEnd: 0, tex: TEX_PUFF, gravity: -4 });
  }

  /** Big impact on the ground: crater + debris + ring + dust; knocks up the source's enemies. */
  groundImpact(p: THREE.Vector3, radius: number, power: number, color: THREE.ColorRepresentation, source?: Fighter): void {
    const c = p.clone();
    this.sfx.play(radius > 3 ? 'explode' : 'impact', c, Math.min(2, radius / 2));
    this.engine.destruction.carve(new SphereShape(c, radius, 0.55), { mode: 'smash', power, impulse: 9 + radius * 2 });
    this.addRing(new THREE.Vector3(p.x, p.y, p.z), radius * 3.2, color, 0.5);
    const dust = this.engine.dust;
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      dust.spawn({ x: p.x + Math.cos(a) * radius * 0.6, y: p.y + 0.2, z: p.z + Math.sin(a) * radius * 0.6, vx: Math.cos(a) * (5 + Math.random() * 5), vy: 0.5 + Math.random(), vz: Math.sin(a) * (5 + Math.random() * 5), size: 0.6, sizeEnd: 2.2, life: 0.9 + Math.random() * 0.6, r: 0.62, g: 0.58, b: 0.52, alpha: 0.55, alphaEnd: 0, tex: TEX_PUFF, drag: 2.2 });
    }
    // nearby enemies get knocked up
    for (const o of this.fighters) {
      if (o.dead || (source ? o === source || o.team === source.team : o === this.player)) continue;
      const d = o.pos.distanceTo(p);
      if (d < radius * 2.5) {
        _v.subVectors(o.pos, p).setY(0).normalize();
        o.body.vel.y = Math.max(o.body.vel.y, 7 * (1 - d / (radius * 2.5)));
      }
    }
  }

  onDash(f: Fighter): void {
    this.sfx.play('shunpo', f.center());
    if (f === this.player) {
      this.cam.punchFov(9);
      this.engine.gr.chroma.offset.set(0.0025, 0.0025);
    }
    // kick up dust at the start
    const p = f.pos;
    for (let i = 0; i < 8; i++)
      this.engine.dust.spawn({ x: p.x, y: p.y + 0.1, z: p.z, vx: (Math.random() - 0.5) * 4 - f.dashDir.x * 3, vy: Math.random() * 1.5, vz: (Math.random() - 0.5) * 4 - f.dashDir.z * 3, size: 0.4, sizeEnd: 1.2, life: 0.5, r: 0.7, g: 0.68, b: 0.64, alpha: 0.4, alphaEnd: 0, tex: TEX_PUFF, drag: 3 });
  }

  /** A fighter knocked into a wall at speed smashes it. */
  onWallSlam(f: Fighter, speed: number): void {
    const p = f.center();
    p.addScaledVector(f.body.wallNormal, -0.5);
    this.engine.destruction.carve(new SphereShape(p, Math.min(2.2, 0.6 + speed * 0.06)), { mode: 'smash', power: 30 + speed * 6, impulse: speed * 0.4 });
    if (this.player && f.pos.distanceTo(this.player.pos) < 25) this.shake(0.25);
  }

  // ------------------------------------------------------------------ loop

  update(dt: number): void {
    if (this.slowmo > 0) {
      this.slowmo -= dt;
      this.engine.timeScale = this.slowmo > 0 ? this.slowmoScale : 1;
    }
    this.time += dt;
    for (const c of this.controllers) c.update(dt);
    for (const f of this.fighters) f.update(dt);
    // fighter separation (no stacking)
    for (let i = 0; i < this.fighters.length; i++)
      for (let j = i + 1; j < this.fighters.length; j++) {
        const a = this.fighters[i], b = this.fighters[j];
        if (a.dead || b.dead) continue;
        const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
        const dy = Math.abs(b.pos.y - a.pos.y);
        const r = a.def.radius + b.def.radius;
        const d2 = dx * dx + dz * dz;
        if (d2 < r * r && dy < Math.max(a.def.height, b.def.height) * 0.8 && d2 > 1e-6) {
          const d = Math.sqrt(d2), push = (r - d) * 0.5;
          a.body.pos.x -= (dx / d) * push; a.body.pos.z -= (dz / d) * push;
          b.body.pos.x += (dx / d) * push; b.body.pos.z += (dz / d) * push;
        }
      }
    for (const p of this.projectiles) p.update(dt, this);
    for (let i = this.projectiles.length - 1; i >= 0; i--)
      if (this.projectiles[i].done) {
        this.projectiles[i].dispose();
        this.projectiles.splice(i, 1);
      }
    // corpses fade then leave
    for (let i = this.fighters.length - 1; i >= 0; i--) {
      const f = this.fighters[i];
      if (f.dead && f !== this.player && f.deathT > (f.def.boss ? 6 : 2.4)) this.remove(f);
    }
  }

  render(dt: number, alpha: number): void {
    const t = this.time;
    for (const c of this.controllers) c.render?.(dt);
    for (const f of this.fighters) f.render(dt, alpha, t);
    for (const p of this.projectiles) p.render?.(dt, t);
    for (const r of this.rings) r.update(dt);
    for (let i = this.rings.length - 1; i >= 0; i--)
      if (this.rings[i].done) {
        this.rings[i].mesh.removeFromParent();
        this.rings.splice(i, 1);
      }
    if (this.player) {
      this.cam.update(dt, this.player.renderPos);
      this.engine.gr.updateSun(this.player.renderPos);
      this.sfx.setListener(this.engine.gr.camera.position, this.engine.gr.camera);
    }
    const ch = this.engine.gr.chroma.offset;
    ch.multiplyScalar(Math.exp(-dt * 8));
    this.hud?.update(dt);
    this.input.endFrame();
  }
}

export { TEX_GLOW, TEX_PUFF, TEX_RING, TEX_STREAK };
