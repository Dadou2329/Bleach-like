// Fighter: one combatant — visual + animator + kinematic body + aura/trail/afterimages + stats and an
// action slot. Controllers (player input or AI) set intents (wish direction, face target) and start
// actions; the fighter integrates movement (run, jump, reishi air-steps, hover, Shunpo) every sim step.
import * as THREE from 'three';
import type { ClipDef } from '../anim/clip';
import { Animator } from '../anim/animator';
import type { StanceDef } from '../anim/locomotion';
import type { VoxelModel } from '../models/builder';
import type { CharacterAsset } from '../chars/ichigo';
import { CharacterVisual } from './characterFactory';
import { KinematicBody } from './kinematic';
import { Aura, type AuraStyle } from '../vfx/aura';
import { SwordTrail } from '../vfx/trail';
import { AfterimagePool } from '../vfx/afterimage';
import type { DamageOpts, Game } from './game';
import { angleDelta, damp } from '../core/math';

export interface PropDef {
  key: string;
  model: VoxelModel;
  socket: string;
}

export interface FighterDef {
  id: string;
  name: string;
  /** rank / affiliation shown under the name on the rival bar */
  title?: string;
  build(): { asset: CharacterAsset; props: PropDef[] };
  stance: StanceDef;
  clips: ClipDef[];
  aura: AuraStyle;
  /** blade sample points in the weapon prop's local space (m) */
  blade?: { prop: string; base: [number, number, number]; tip: [number, number, number]; color: string; core: string };
  hp: number;
  rei: number;
  speed: { run: number; sprint: number; jump: number; dash: number; dashTime: number };
  /** hurt capsule */
  radius: number;
  height: number;
  /** boss: big HP bar, long death */
  boss?: boolean;
  /** hits above this fraction of the height count as weak-point hits (×3) */
  weakAbove?: number;
}

export abstract class FighterAction {
  t = 0;
  done = false;
  /** 0 = rooted, 1 = full locomotion while acting */
  mobility = 0;
  /** keep facing the target/aim while acting */
  trackTarget = true;
  /** gravity scale while airborne during this action */
  airGravity = 0.15;
  /** damage reduction / immunity */
  armor = 0;
  invulnerable = false;
  abstract readonly name: string;
  start(_f: Fighter, _g: Game): void {}
  update(_f: Fighter, _g: Game, dt: number): void {
    this.t += dt;
  }
  end(_f: Fighter, _g: Game): void {}
  /** another action wants to start; return true to allow interrupting this one */
  canCancel(_next: FighterAction): boolean {
    return false;
  }
}

let FID = 0;

export class Fighter {
  readonly id = ++FID;
  visual: CharacterVisual;
  anim: Animator;
  readonly body: KinematicBody;
  aura: Aura;
  readonly trail: SwordTrail | null;
  ghosts: AfterimagePool;
  team: number;
  name: string;
  yaw = 0;
  hp: number;
  maxHp: number;
  rei: number;
  maxRei: number;
  // intents
  readonly wish = new THREE.Vector3();
  wishSprint = false;
  wishHover = false;
  wishDescend = false;
  /** face this world point while attacking (lock-on / aim) */
  faceTarget: THREE.Vector3 | null = null;
  aimDir = new THREE.Vector3(0, 0, 1);
  action: FighterAction | null = null;
  hitstun = 0;
  invuln = 0;
  dead = false;
  deathT = 0;
  hovering = false;
  sprinting = false;
  private sprintGhostT = 0;
  // dash
  dashT = 0;
  readonly dashDir = new THREE.Vector3();
  private dashGhostT = 0;
  /** extra velocity applied by attacks (lunges, knockback), decays */
  readonly push = new THREE.Vector3();
  pushDrag = 7;
  private prevVel = new THREE.Vector3();
  private prevPhase = 0;
  private yawRate = 0;
  readonly renderPos = new THREE.Vector3();
  private bladeBase = new THREE.Vector3();
  private bladeTip = new THREE.Vector3();
  readonly prevBladeBase = new THREE.Vector3();
  readonly prevBladeTip = new THREE.Vector3();
  bladeValid = false;
  /** set by actions: blade cuts the world / hits fighters this frame */
  bladeActive = false;
  bladeSpec: BladeSpec | null = null;
  readonly bladeHits = new Set<number>();
  flashT = 0;
  /** outgoing damage multiplier (forms, flares, masks) */
  power = 1;
  /** incoming damage multiplier (masks, armour states) */
  damageTaken = 1;
  /** reiatsu armour: hits weaker than this barely scratch (a quarter of the damage, no stagger) */
  toughness = 0;
  /** called after this fighter takes damage */
  onHurt: ((amount: number, heavy: boolean) => void) | null = null;
  /** checked when a hit would kill: return true to survive it (the kit sets hp itself) */
  onLethal: (() => boolean) | null = null;
  /** checked before a hit lands: return true to stop it outright (Aizen's raised finger) */
  parry: ((amount: number, from: Fighter | null, o: DamageOpts) => boolean) | null = null;
  /** where opponents believe this fighter stands (Kyōka Suigetsu's copy); the duel AI fights this */
  lure: THREE.Vector3 | null = null;
  stats = { damageDealt: 0, kills: 0 };
  /** arbitrary per-kit state */
  readonly data: Record<string, unknown> = {};

  constructor(public def: FighterDef, readonly game: Game, team: number, pos: THREE.Vector3) {
    this.team = team;
    this.name = def.name;
    const { asset, props } = def.build();
    this.visual = new CharacterVisual(asset.model, asset.springs, asset.colliders);
    for (const p of props) this.visual.attach(p.key, p.model, p.socket);
    this.anim = new Animator(this.visual.rig, def.stance, this.visual.springs);
    this.anim.register(def.clips);
    this.body = new KinematicBody(game.engine.world);
    this.body.pos.copy(pos);
    this.body.prev.copy(pos);
    this.renderPos.copy(pos);
    this.hp = this.maxHp = def.hp;
    this.rei = this.maxRei = def.rei;
    this.aura = new Aura(this.visual, def.aura, game.engine.glow);
    this.ghosts = new AfterimagePool(this.visual, 12);
    this.ghosts.color.set(def.aura.body);
    if (def.blade) {
      this.trail = new SwordTrail(30, def.blade.color, def.blade.core);
    } else this.trail = null;
    const scene = game.engine.gr.scene;
    scene.add(this.visual.object, this.aura.group, this.ghosts.group);
    if (this.trail) scene.add(this.trail.mesh);
  }

  get pos(): THREE.Vector3 {
    return this.body.pos;
  }

  /** chest-height centre (world) */
  center(out = new THREE.Vector3()): THREE.Vector3 {
    return out.set(this.body.pos.x, this.body.pos.y + this.def.height * 0.55, this.body.pos.z);
  }

  forward(out = new THREE.Vector3()): THREE.Vector3 {
    return out.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
  }

  get grounded(): boolean {
    return this.body.grounded;
  }

  get busy(): boolean {
    return this.action !== null || this.hitstun > 0 || this.dashT > 0 || this.dead;
  }

  /** Start an action (respecting cancel rules). Returns false if blocked. */
  act(a: FighterAction, force = false): boolean {
    if (this.dead) return false;
    if (this.action && !force && !this.action.canCancel(a)) return false;
    if (this.hitstun > 0 && !force) return false;
    if (this.action) {
      this.action.end(this, this.game);
    }
    this.action = a;
    a.start(this, this.game);
    return true;
  }

  stopAction(): void {
    if (!this.action) return;
    this.action.end(this, this.game);
    this.action = null;
    this.bladeActive = false;
  }

  spendRei(n: number): boolean {
    if (this.rei < n) return false;
    this.rei -= n;
    return true;
  }

  /** Shunpo: near-instant dash with afterimages. */
  dash(dir: THREE.Vector3): boolean {
    if (this.dead || this.dashT > 0 || this.hitstun > 0.15) return false;
    if (this.action && !this.action.canCancel(DASH_PROBE)) return false;
    if (!this.spendRei(4)) return false;
    this.stopAction();
    this.dashDir.copy(dir).setY(0);
    if (this.dashDir.lengthSq() < 1e-4) this.forward(this.dashDir);
    this.dashDir.normalize();
    // slight vertical component when airborne & aiming up/down
    this.dashT = this.def.speed.dashTime;
    this.yaw = Math.atan2(this.dashDir.x, this.dashDir.z);
    this.ghosts.spawn(0.45, 1);
    this.dashGhostT = 0;
    this.invuln = Math.max(this.invuln, this.def.speed.dashTime + 0.05);
    this.anim.play('dash', { fadeIn: 0.03 });
    this.game.onDash(this);
    return true;
  }

  update(dt: number): void {
    const g = this.game;
    const b = this.body;
    this.invuln = Math.max(0, this.invuln - dt);
    this.flashT = Math.max(0, this.flashT - dt);
    if (this.dead) {
      this.deathT += dt;
      b.vel.x = damp(b.vel.x, 0, 4, dt);
      b.vel.z = damp(b.vel.z, 0, 4, dt);
      b.float = false;
      b.step(dt);
      this.anim.update(dt, { vx: 0, vz: 0, vy: b.vel.y, grounded: b.grounded, turn: 0, accel: 0 });
      return;
    }
    if (this.hitstun > 0) this.hitstun -= dt;
    // ---- action
    const a = this.action;
    if (a) {
      a.update(this, g, dt);
      if (a.done) {
        a.end(this, g);
        if (this.action === a) this.action = null;
        this.bladeActive = false;
      }
    }
    // ---- facing
    let wantYaw: number | null = null;
    const acting = this.action !== null;
    if ((acting && this.action!.trackTarget) || this.faceTarget) {
      if (this.faceTarget) wantYaw = Math.atan2(this.faceTarget.x - b.pos.x, this.faceTarget.z - b.pos.z);
      else if (acting) wantYaw = Math.atan2(this.aimDir.x, this.aimDir.z);
    }
    if (wantYaw === null && this.wish.lengthSq() > 0.01 && this.dashT <= 0) wantYaw = Math.atan2(this.wish.x, this.wish.z);
    const oldYaw = this.yaw;
    if (wantYaw !== null && this.dashT <= 0) {
      const rate = acting ? 22 : 13;
      this.yaw += angleDelta(this.yaw, wantYaw) * (1 - Math.exp(-rate * dt));
    }
    this.yawRate = angleDelta(oldYaw, this.yaw) / Math.max(1e-4, dt);

    // ---- movement
    const sp = this.def.speed;
    let mobility = this.hitstun > 0 ? 0 : this.action ? this.action.mobility : 1;
    if (this.dashT > 0) {
      this.dashT -= dt;
      const v = (sp.dash / sp.dashTime);
      b.vel.set(this.dashDir.x * v, 0, this.dashDir.z * v);
      b.float = true;
      this.dashGhostT += dt;
      if (this.dashGhostT > 0.035) {
        this.dashGhostT = 0;
        this.ghosts.spawn(0.35, 0.8);
      }
      if (this.dashT <= 0) {
        // keep momentum
        b.vel.set(this.dashDir.x * sp.sprint * 0.8, 0, this.dashDir.z * sp.sprint * 0.8);
        b.float = this.hovering;
        this.ghosts.spawn(0.5, 1);
        this.sprinting = this.wishSprint;
      }
      mobility = 0;
    } else {
      // sprint (Shunpo run) while the dash key stays held after a dash
      if (!this.wishSprint || this.wish.lengthSq() < 0.01) this.sprinting = false;
      const speed = this.sprinting ? sp.sprint : sp.run;
      const wx = this.wish.x * speed * mobility, wz = this.wish.z * speed * mobility;
      const accel = (b.grounded || this.hovering ? 70 : 28) * dt;
      const dx = wx - b.vel.x, dz = wz - b.vel.z;
      const dl = Math.hypot(dx, dz);
      const k = dl > accel ? accel / dl : 1;
      b.vel.x += dx * k;
      b.vel.z += dz * k;
      if (this.sprinting) {
        this.sprintGhostT += dt;
        if (this.sprintGhostT > 0.09) {
          this.sprintGhostT = 0;
          this.ghosts.spawn(0.3, 0.55);
        }
      }
      // hover on reishi footholds
      if (this.hovering) {
        b.float = true;
        b.vel.y = damp(b.vel.y, this.wishDescend ? -9 : 0, 6, dt);
        if (!this.wishHover && !this.wishDescend) this.hovering = false;
        if (b.grounded) this.hovering = false;
      } else {
        b.float = false;
        if (!b.grounded && this.wishDescend) b.vel.y = Math.min(b.vel.y, -16);
        // airborne attacks hang
        if (!b.grounded && this.action && b.vel.y < 0) b.vel.y = Math.max(b.vel.y, -30 * this.action.airGravity);
      }
    }
    // pushes (lunges, knockback)
    const pushLen = Math.hypot(this.push.x, this.push.z);
    b.vel.x += this.push.x;
    b.vel.z += this.push.z;
    b.vel.y += this.push.y;
    b.step(dt);
    // a blocked axis is zeroed by the body: drop the push on it too, otherwise remove the push again
    if (b.vel.x === 0) this.push.x = 0;
    else b.vel.x -= this.push.x;
    if (b.vel.z === 0) this.push.z = 0;
    else b.vel.z -= this.push.z;
    this.push.y = 0;
    this.push.multiplyScalar(Math.exp(-this.pushDrag * dt));
    if (this.push.lengthSq() < 0.01) this.push.set(0, 0, 0);
    if (b.hitWall && pushLen > 6) g.onWallSlam(this, pushLen);

    // ---- reiatsu regen
    this.rei = Math.min(this.maxRei, this.rei + dt * (this.action ? 2 : 6));

    // ---- animation inputs (character space)
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    const vx = b.vel.x, vz = b.vel.z;
    const lx = vx * cy - vz * sy, lz = vx * sy + vz * cy;
    const fwdAccel = ((vx - this.prevVel.x) * sy + (vz - this.prevVel.z) * cy) / dt;
    this.prevVel.copy(b.vel);
    this.anim.plant = this.hovering ? 0 : 1;
    // footsteps at the two contact points of the gait cycle
    const ph = this.anim.loco.phase;
    if (b.grounded && Math.hypot(b.vel.x, b.vel.z) > 1.2 && ((this.prevPhase < 0.25 && ph >= 0.25) || (this.prevPhase < 0.75 && ph >= 0.75))) {
      if (this.def.boss) {
        g.sfx.play('impact', this.pos, 1.2);
        if (g.player && g.player.pos.distanceTo(this.pos) < 70) g.shake(0.18);
      } else g.sfx.play('step', this.pos, this.sprinting ? 1.4 : 1);
    }
    this.prevPhase = ph;
    this.anim.update(dt, {
      vx: lx, vz: lz, vy: b.vel.y,
      grounded: b.grounded || this.hovering,
      turn: this.yawRate,
      accel: Math.max(-30, Math.min(30, fwdAccel)),
    });
  }

  /** Per rendered frame: interpolate, pose, effects. */
  render(dt: number, alpha: number, time: number): void {
    const b = this.body;
    this.renderPos.lerpVectors(b.prev, b.pos, alpha);
    const o = this.visual.object;
    o.position.copy(this.renderPos);
    o.position.y += b.stepOffset;
    o.rotation.y = this.yaw;
    o.updateMatrixWorld(true);
    this.anim.apply(dt);
    // hit flash
    const u = this.visual.material.userData.uniforms;
    u.uFlash.value.w = this.flashT > 0 ? Math.min(1, this.flashT / 0.08) : 0;
    u.uTime.value = time;
    // rim light follows the aura
    const lv = Math.min(1, this.aura.level);
    const rc = new THREE.Color(this.def.aura.body);
    u.uRim.value.set(rc.r, rc.g, rc.b, 0.15 + lv * 0.9);
    if (this.dead) u.uDissolve.value = Math.min(1, Math.max(0, (this.deathT - (this.def.boss ? 1.2 : 0.6)) / (this.def.boss ? 3.5 : 1.4)));
    for (const p of this.visual.props.values()) {
      // props follow the body, plus their own flash / dissolve (a mask forming or breaking)
      const pu = p.material.userData.uniforms;
      pu.uFlash.value.w = Math.max(u.uFlash.value.w, (p.userData.flash as number | undefined) ?? 0);
      pu.uDissolve.value = Math.max(u.uDissolve.value, (p.userData.dissolve as number | undefined) ?? 0);
      pu.uTime.value = time;
    }
    this.aura.update(dt, time);
    this.ghosts.update(dt, time);
    // blade sampling (trail + sweep hits)
    if (this.def.blade) {
      const prop = this.visual.props.get(this.def.blade.prop);
      if (prop) {
        prop.updateMatrixWorld(true);
        this.prevBladeBase.copy(this.bladeBase);
        this.prevBladeTip.copy(this.bladeTip);
        this.bladeBase.set(...this.def.blade.base).applyMatrix4(prop.matrixWorld);
        this.bladeTip.set(...this.def.blade.tip).applyMatrix4(prop.matrixWorld);
        if (!this.bladeValid) {
          this.prevBladeBase.copy(this.bladeBase);
          this.prevBladeTip.copy(this.bladeTip);
          this.bladeValid = true;
        }
        if (this.trail) this.trail.update(dt, this.bladeBase, this.bladeTip);
        if (this.bladeActive && this.bladeSpec) this.game.bladeSweep(this, this.prevBladeBase, this.prevBladeTip, this.bladeBase, this.bladeTip, this.bladeSpec);
      }
    }
  }

  /**
   * Swap the body (form change: Bankai, Resurrección, masks): new visual/animator/aura on the same
   * skeleton layout; locomotion phase, aura level and the running clip carry over.
   */
  setForm(build: { asset: CharacterAsset; props: PropDef[] }, aura: AuraStyle, blade?: FighterDef['blade']): void {
    const scene = this.game.engine.gr.scene;
    const old = { v: this.visual, a: this.anim, au: this.aura, g: this.ghosts };
    old.v.object.removeFromParent();
    old.au.group.removeFromParent();
    old.g.group.removeFromParent();
    this.visual = new CharacterVisual(build.asset.model, build.asset.springs, build.asset.colliders);
    for (const p of build.props) this.visual.attach(p.key, p.model, p.socket);
    this.anim = new Animator(this.visual.rig, this.def.stance, this.visual.springs);
    this.anim.register(this.def.clips);
    this.anim.loco.phase = old.a.loco.phase;
    Object.assign(this.anim.loco.w, old.a.loco.w);
    for (const a of old.a.active) {
      if (a.ending) continue;
      const inst = this.anim.play(a.clip.name, { fadeIn: 0, hold: a.hold, onEvent: a.onEvent, onEnd: a.onEnd });
      if (inst) { inst.time = a.time; inst.weight = 1; }
    }
    this.aura = new Aura(this.visual, aura, this.game.engine.glow);
    this.aura.level = old.au.level;
    this.aura.target = old.au.target;
    this.def = { ...this.def, aura, blade: blade ?? this.def.blade };
    this.ghosts = new AfterimagePool(this.visual, 12);
    this.ghosts.color.set(aura.body);
    if (this.trail && blade) this.trail.setColor(blade.color, blade.core);
    this.visual.object.position.copy(this.renderPos);
    this.visual.object.rotation.y = this.yaw;
    scene.add(this.visual.object, this.aura.group, this.ghosts.group);
    this.bladeValid = false;
  }

  get blade(): { base: THREE.Vector3; tip: THREE.Vector3 } {
    return { base: this.bladeBase, tip: this.bladeTip };
  }

  dispose(): void {
    this.visual.object.removeFromParent();
    this.aura.group.removeFromParent();
    this.ghosts.group.removeFromParent();
    this.trail?.mesh.removeFromParent();
  }
}

export interface BladeSpec {
  damage: number;
  knock: number;
  launch: number;
  hitstop: number;
  shake: number;
  /** cut power against world materials (0 = no world damage) */
  cut: number;
  /** stagger strength: 'light' flinch or 'heavy' knockdown */
  heavy?: boolean;
}

class DashProbe extends FighterAction {
  readonly name = 'dash';
}
const DASH_PROBE = new DashProbe();
export { DASH_PROBE };
