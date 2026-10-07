// Kenpachi's kit (docs/roster/B3-captains-3.md, Kenpachi kit proposal). Sealed: no pattern — every
// press draws a different swing (sweep, chop, riser, thrust, left jab, front kick) and every hit of a
// string lands harder than the last; the lazy wrist flick that cuts a building in half; Kendō —
// Ryōdan, the two-handed bisection that splits the ground; the reiatsu shock wave; the Leg Burst charge
// through walls. G: the eyepatch comes off — the golden pillar, the skull, swings that cut far beyond
// the blade. F: "Nome, Nozarashi" — the giant war-cleaver and Meteor Cleaver; F again: Bankai — the
// crimson oni, distant bisection, power bleeding out of his own body. Passives: reiatsu armour (weak
// hits barely scratch him) and a near-death surge.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game, Projectile } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { KENPACHI_RES, kenpachiAsset, kenpachiProp } from '../../chars/kenpachi';
import {
  KENPACHI_BANKAI_CHAIN, KENPACHI_BANKAI_STANCE, KENPACHI_CLIPS, KENPACHI_POOL, KENPACHI_SHIKAI_CHAIN, KENPACHI_SHIKAI_STANCE, KENPACHI_STANCE,
} from '../../chars/kenpachiClips';
import { BoxShape, CapsuleShape, SphereShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_PUFF, TEX_RING, TEX_STREAK } from '../../vfx/sprites';
import { SkullAura } from '../../vfx/skull';
import { ShardBurst } from '../../vfx/shards';
import type { PropMesh } from '../characterFactory';
import type { AuraStyle } from '../../vfx/aura';

export const AURA_KENPACHI: AuraStyle = { core: '#FFF2B3', body: '#F6C823', rim: '#B8860B' };
export const AURA_KENPACHI_BANKAI: AuraStyle = { core: '#FFF4C2', body: '#FF6A1A', rim: '#B3231D' };
const GOLD = '#F6C823';
const EMBER = '#FF6A1A';

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE_SEALED: BladeDef = { prop: 'sword', base: [0, 0, 0.16], tip: [0, 0, 1.29], color: '#FFD84A', core: '#FFF6D0' };
const BLADE_CLEAVER: BladeDef = { prop: 'sword', base: [0, -0.3, 0.62], tip: [0, -0.5, 2.25], color: '#FFD84A', core: '#FFF6D0' };
const BLADE_BANKAI: BladeDef = { prop: 'sword', base: [0, -0.2, 0.16], tip: [0, -0.3, 1.5], color: '#FF7A2A', core: '#FFE2B0' };

export const KENPACHI_DEF: FighterDef = {
  id: 'kenpachi',
  name: 'Zaraki Kenpachi',
  title: 'Captain, 11th Division',
  build: () => ({
    asset: kenpachiAsset('sealed'),
    props: [
      { key: 'sword', model: kenpachiProp('nozarashi'), socket: 'grip.R' },
      { key: 'saya', model: kenpachiProp('saya'), socket: 'hip.L' },
      { key: 'patch', model: kenpachiProp('eyepatch'), socket: 'patch' },
      { key: 'rider', model: kenpachiProp('yachiru'), socket: 'rider' },
    ],
  }),
  stance: KENPACHI_STANCE,
  clips: KENPACHI_CLIPS,
  aura: AURA_KENPACHI,
  blade: BLADE_SEALED,
  hp: 1300,
  rei: 110,
  speed: { run: 9, sprint: 19, jump: 11, dash: 10, dashTime: 0.12 },
  radius: 0.46,
  height: 2.02,
};

const SPEED_BANKAI = { run: 11.5, sprint: 25, jump: 13.5, dash: 13, dashTime: 0.11 };

type Form = 'sealed' | 'shikai' | 'bankai';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _m = new THREE.Matrix4();
const UP = new THREE.Vector3(0, 1, 0);

interface StrikeSpec {
  damage: number;
  knock: number;
  launch?: number;
  heavy?: boolean;
  hitstop?: number;
  shake?: number;
  /** strike sphere: distance in front, height above the feet, radius (m) */
  reach: number;
  height: number;
  radius: number;
  /** world damage at the strike point: [radius, power] */
  smash?: [number, number];
}

interface MoveInfo {
  lunge: number;
  /** blade active window and trail window (s); the blade sweep does the hitting */
  window?: [number, number];
  trail?: [number, number];
  spec?: BladeSpec;
  /** clear the hit list at this time (multi-hit spins) */
  rehit?: number;
  /** body strike (fist, foot) at the 'hit' event */
  strike?: StrikeSpec;
  /** angle of the cut plane about the forward axis (deg): 0 = horizontal, 90 = vertical; none = thrust */
  plane?: number;
  /** crater where the blade lands: [radius, power] */
  ground?: [number, number];
}

const MOVES: Record<string, MoveInfo> = {
  kp_sweep: { lunge: 7, window: [0.14, 0.3], trail: [0.12, 0.38], plane: 4, spec: { damage: 22, knock: 7, launch: 1, hitstop: 0.05, shake: 0.14, cut: 300 } },
  kp_chop: { lunge: 6, window: [0.22, 0.34], trail: [0.2, 0.42], plane: 90, ground: [1.3, 110], spec: { damage: 28, knock: 6, launch: 0, hitstop: 0.07, shake: 0.25, cut: 340 } },
  kp_rise: { lunge: 6, window: [0.11, 0.26], trail: [0.09, 0.34], plane: -40, spec: { damage: 22, knock: 5, launch: 7, hitstop: 0.05, shake: 0.14, cut: 300 } },
  kp_thrust: { lunge: 11, window: [0.14, 0.3], trail: [0.13, 0.36], spec: { damage: 26, knock: 12, launch: 1, hitstop: 0.06, shake: 0.2, cut: 320 } },
  kp_punch: { lunge: 6, strike: { damage: 18, knock: 9, launch: 1, reach: 1.25, height: 1.6, radius: 0.85, hitstop: 0.05, shake: 0.14, smash: [0.6, 30] } },
  kp_kick: { lunge: 5, strike: { damage: 24, knock: 22, launch: 4, heavy: true, reach: 1.45, height: 1.05, radius: 1.0, hitstop: 0.08, shake: 0.3, smash: [0.9, 70] } },
  kp_cl1: { lunge: 6, window: [0.27, 0.42], trail: [0.24, 0.5], plane: 90, ground: [2.4, 200], spec: { damage: 60, knock: 12, launch: 3, heavy: true, hitstop: 0.1, shake: 0.45, cut: 700 } },
  kp_cl2: { lunge: 6, window: [0.19, 0.38], trail: [0.17, 0.46], plane: 4, spec: { damage: 48, knock: 16, launch: 3, heavy: true, hitstop: 0.09, shake: 0.35, cut: 650 } },
  kp_cl3: { lunge: 4, window: [0.12, 0.54], trail: [0.1, 0.56], plane: 4, rehit: 0.34, spec: { damage: 36, knock: 18, launch: 4, heavy: true, hitstop: 0.07, shake: 0.3, cut: 600 } },
  kp_bk1: { lunge: 8, window: [0.08, 0.19], trail: [0.067, 0.25], plane: -40, spec: { damage: 40, knock: 8, launch: 6, hitstop: 0.06, shake: 0.2, cut: 600 } },
  kp_bk2: { lunge: 8, window: [0.104, 0.222], trail: [0.09, 0.28], plane: 4, spec: { damage: 40, knock: 10, launch: 1, hitstop: 0.06, shake: 0.2, cut: 600 } },
  kp_bk3: { lunge: 7, window: [0.17, 0.26], trail: [0.154, 0.32], plane: 90, ground: [2, 180], spec: { damage: 52, knock: 8, launch: 2, heavy: true, hitstop: 0.09, shake: 0.35, cut: 700 } },
};

/** Hit everything inside the strike sphere once; optional world smash at the same point. */
function strike(f: Fighter, g: Game, s: StrikeSpec, hit: Set<number>, mul: number): { p: THREE.Vector3; landed: number } {
  const fw = f.forward(_w);
  const p = new THREE.Vector3().copy(f.pos).addScaledVector(fw, s.reach);
  p.y += s.height;
  let landed = 0;
  for (const o of g.enemiesOf(f)) {
    if (hit.has(o.id)) continue;
    const cy = Math.max(o.pos.y + 0.2, Math.min(o.pos.y + o.def.height - 0.2, p.y));
    const d = Math.hypot(o.pos.x - p.x, cy - p.y, o.pos.z - p.z);
    if (d > s.radius + o.def.radius) continue;
    hit.add(o.id);
    landed++;
    const dir = _v.subVectors(o.pos, f.pos).setY(0);
    if (dir.lengthSq() < 1e-4) dir.copy(fw);
    dir.normalize().multiplyScalar(0.7).addScaledVector(fw, 0.3).normalize();
    g.damage(o, s.damage * mul, f, dir.clone(), { knock: s.knock, launch: s.launch, heavy: s.heavy, hitstop: s.hitstop, shake: s.shake });
    g.sparks(new THREE.Vector3(o.pos.x, cy, o.pos.z), dir, f.def.aura.body, 14);
  }
  if (s.smash) g.engine.destruction.carve(new SphereShape(p, s.smash[0]), { mode: 'smash', power: s.smash[1] * mul, impulse: 6 + s.smash[1] * 0.06, dust: 0.5 });
  return { p, landed };
}

/**
 * Orientation of a thin cut slab in front of the fighter: local X along `fw`, local Z across, tilted
 * by `tiltDeg` about the forward axis (0 = horizontal slab, 90 = vertical), local Y the slab normal.
 */
function slabQuat(fw: THREE.Vector3, tiltDeg: number): { q: THREE.Quaternion; across: THREE.Vector3; normal: THREE.Vector3 } {
  const right = new THREE.Vector3(-fw.z, 0, fw.x);
  const across = right.clone().applyAxisAngle(fw, (tiltDeg * Math.PI) / 180);
  const normal = new THREE.Vector3().crossVectors(across, fw).normalize();
  _m.makeBasis(fw, normal, across);
  return { q: new THREE.Quaternion().setFromRotationMatrix(_m), across, normal };
}

/** A golden sheet of light lying in a cut plane, a bright line down its middle, fading fast. */
class CutFlash implements Projectile {
  done = false;
  private mesh: THREE.Mesh;
  private u: Record<string, THREE.IUniform>;
  private t = 0;
  constructor(g: Game, center: THREE.Vector3, q: THREE.Quaternion, len: number, width: number, color: THREE.ColorRepresentation, private dur = 0.45) {
    const geo = new THREE.PlaneGeometry(len, width);
    geo.rotateX(-Math.PI / 2);
    this.u = { uT: { value: 0 }, uCol: { value: new THREE.Color(color) } };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.u,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float uT; uniform vec3 uCol; varying vec2 vUv;
        void main() {
          float across = abs(vUv.y - 0.5) * 2.0;
          float line = pow(1.0 - across, 14.0);
          float sheet = pow(1.0 - across, 2.0) * 0.22;
          float along = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
          float k = 1.0 - uT;
          float a = (line * 1.4 + sheet) * along * k * k;
          gl_FragColor = vec4(mix(uCol, vec3(1.0), line) * 2.0, a);
        }`,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(center);
    this.mesh.quaternion.copy(q);
    this.mesh.renderOrder = 6;
    this.mesh.frustumCulled = false;
    g.engine.gr.scene.add(this.mesh);
  }
  update(dt: number): void {
    this.t += dt / this.dur;
    if (this.t >= 1) this.done = true;
  }
  render(): void {
    this.u.uT.value = Math.min(1, this.t);
  }
  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

/** Yachiru hops off his shoulder when he gets serious: a little arc, a spin, a pink puff. */
class Dismount implements Projectile {
  done = false;
  private t = 0;
  private v: THREE.Vector3;
  constructor(private g: Game, private mesh: PropMesh, away: THREE.Vector3) {
    this.v = away.clone().multiplyScalar(4).setY(6);
  }
  update(dt: number): void {
    this.t += dt;
    this.v.y -= 22 * dt;
    this.mesh.position.addScaledVector(this.v, dt);
    this.mesh.rotateY(dt * 7);
    if (this.t > 0.62) {
      const p = this.mesh.position;
      for (let i = 0; i < 18; i++)
        this.g.engine.glow.spawn({ x: p.x, y: p.y + 0.4, z: p.z, vx: (Math.random() - 0.5) * 3, vy: Math.random() * 2.5, vz: (Math.random() - 0.5) * 3, size: 0.18, sizeEnd: 0.03, life: 0.5, r: 1, g: 0.55, b: 0.75, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 1.5 });
      this.g.engine.dust.spawn({ x: p.x, y: p.y + 0.4, z: p.z, size: 0.5, sizeEnd: 1.4, life: 0.5, r: 1, g: 0.8, b: 0.88, alpha: 0.6, alphaEnd: 0, tex: TEX_PUFF });
      this.done = true;
    }
  }
  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.material.dispose();
  }
}

// ------------------------------------------------------------------ the string

class SwingAction extends FighterAction {
  readonly name: string;
  private info: MoveInfo;
  private dur = 0;
  private comboAt = 0;
  private hitAt = 0;
  private struck = false;
  private extended = false;
  private cratered = false;
  private rehitDone = false;
  private seen = 0;
  private hits = new Set<number>();
  queued = false;

  constructor(readonly kit: KenpachiKit, readonly clip: string, readonly heavy = false) {
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
    this.hitAt = c.events.hit ?? this.dur * 0.4;
    const mul = this.kit.growthMul();
    f.bladeHits.clear();
    f.bladeSpec = this.info.spec ? { ...this.info.spec, damage: this.info.spec.damage * mul, cut: this.info.spec.cut * mul, knock: this.info.spec.knock * Math.sqrt(mul) } : null;
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n !== 'step') return;
        const tgt = f.faceTarget;
        const extra = tgt ? Math.min(5, Math.max(0, f.pos.distanceTo(tgt) - 2.1)) : 0;
        f.push.addScaledVector(f.forward(), this.info.lunge + extra * 2.2);
        g.sfx.play(this.kit.form !== 'sealed' || this.info.strike?.heavy ? 'swingHeavy' : 'swing', f.center(), 0.9);
      },
    });
  }

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    const info = this.info;
    if (info.window) {
      f.bladeActive = t >= info.window[0] && t <= info.window[1];
      if (f.trail && info.trail) f.trail.emitting = t >= info.trail[0] && t <= info.trail[1];
      if (info.rehit && !this.rehitDone && t >= info.rehit) {
        this.rehitDone = true;
        f.bladeHits.clear();
      }
      // landed hits feed the growth
      if (f.bladeHits.size > this.seen) {
        this.kit.landed(f.bladeHits.size - this.seen);
        this.seen = f.bladeHits.size;
      }
      // eyepatch off (or released): the cut runs on far past the blade
      if (!this.extended && info.plane !== undefined && t >= (info.window[0] + info.window[1]) * 0.5 && this.kit.bigCuts()) {
        this.extended = true;
        this.kit.reachCut(info.plane, this.kit.form === 'sealed' ? 9 : this.kit.form === 'shikai' ? 13 : 16, info.spec!.cut * 1.4, info.spec!.damage * 0.5 * this.kit.growthMul());
      }
      if (info.ground && !this.cratered && t >= this.hitAt + 0.02) {
        this.cratered = true;
        if (f.grounded) {
          const tip = f.blade.tip.clone();
          tip.y = f.pos.y;
          const mul = this.kit.growthMul();
          g.groundImpact(tip, info.ground[0] * Math.sqrt(mul), info.ground[1] * mul, f.def.aura.body, f);
        }
      }
    }
    if (info.strike && !this.struck && t >= this.hitAt) {
      this.struck = true;
      const r = strike(f, g, info.strike, this.hits, this.kit.growthMul());
      if (r.landed) this.kit.landed(r.landed);
    }
    if (this.queued && t >= this.comboAt) {
      this.done = true;
      this.kit.chainNext();
      return;
    }
    if (t >= this.dur) this.done = true;
  }

  override end(f: Fighter): void {
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }

  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= (this.info.window?.[0] ?? this.hitAt) + 0.05;
    return false;
  }
}

/** Base for specials (the string can cancel into them). */
abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: KenpachiKit) {
    super();
  }
  protected playClip(f: Fighter, clip: string, onEvent: (n: string) => void): void {
    const c = f.anim.clip(clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play(clip, { onEvent });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= this.dur) this.done = true;
  }
  override end(f: Fighter): void {
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }
}

/** RMB, sealed: the lazy wrist flick that cuts a building in half. */
class FlickAction extends SkillAction {
  readonly name = 'flick';
  constructor(kit: KenpachiKit) {
    super(kit);
    this.mobility = 0.1;
    this.airGravity = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = { damage: 26, knock: 8, launch: 1, hitstop: 0.06, shake: 0.2, cut: 380 };
    this.playClip(f, 'kp_flick', (n) => {
      if (n === 'step') g.sfx.play('swing', f.center(), 0.7);
      if (n === 'cut') {
        const len = this.kit.patchOff ? 30 : 17;
        this.kit.buildingCut(len, 5 + (this.kit.patchOff ? 3 : 0), 6, 64 * this.kit.growthMul());
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.bladeActive = this.t >= 0.24 && this.t <= 0.36;
    if (f.trail) f.trail.emitting = this.t >= 0.22 && this.t <= 0.44;
  }
}

/** Q: Kendō — Ryōdan. Both hands raised (the tell), then the bisection that splits the ground. */
class RyodanAction extends SkillAction {
  readonly name = 'ryodan';
  constructor(kit: KenpachiKit, readonly clip = 'kp_ryodan', readonly distant = false) {
    super(kit);
    this.mobility = 0;
    this.airGravity = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = { damage: 60, knock: 14, launch: 4, heavy: true, hitstop: 0.12, shake: 0.6, cut: 900 };
    this.playClip(f, this.clip, (n) => {
      if (n === 'charge') {
        this.armor = 0.6;
        f.aura.flare(1.4, 0.9);
        this.kit.skull.flare(this.kit.patchOff || this.kit.form !== 'sealed' ? 1.3 : 0.6, 1.4);
        g.sfx.play('charge', f.center(), 1);
        if (!this.distant) g.callout('剣道', 'KENDŌ', '#ffe066');
      }
      if (n === 'step') {
        f.push.addScaledVector(f.forward(), 6);
        g.sfx.play('swingHeavy', f.center(), 1.4);
      }
      if (n === 'hit') {
        this.armor = 0;
        if (this.distant) this.kit.distantBisection();
        else this.kit.ryodan();
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const hit = this.distant ? 0.587 : 0.88;
    f.bladeActive = this.t >= hit - 0.06 && this.t <= hit + 0.1;
    if (f.trail) f.trail.emitting = this.t >= hit - 0.1 && this.t <= hit + 0.18;
  }
}

/** E: the reiatsu shock wave. */
class ShockAction extends SkillAction {
  readonly name = 'shock';
  constructor(kit: KenpachiKit) {
    super(kit);
    this.mobility = 0;
    this.airGravity = 0.05;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'kp_shock', (n) => {
      if (n === 'charge') {
        f.aura.flare(1.2, 0.5);
        g.sfx.play('charge', f.center(), 0.8);
      }
      if (n === 'fx') this.kit.shockWave();
    });
  }
}

/** R: Leg Burst — a straight-line explosive sprint that bulldozes walls, the sword levelled ahead. */
class LegBurstAction extends SkillAction {
  readonly name = 'legburst';
  private hits = new Set<number>();
  private dir = new THREE.Vector3();
  private carveT = 0;
  private inst: ReturnType<Fighter['anim']['play']> = null;
  constructor(kit: KenpachiKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0;
    this.airGravity = 0.1;
    this.armor = 0.6;
    this.trackTarget = false;
    this.dur = 0.62;
  }
  override start(f: Fighter, g: Game): void {
    if (this.target) {
      this.dir.subVectors(this.target.pos, f.pos).setY(0);
      if (this.dir.lengthSq() < 0.01) f.forward(this.dir);
    } else f.forward(this.dir);
    this.dir.normalize();
    f.yaw = Math.atan2(this.dir.x, this.dir.z);
    this.inst = f.anim.play('kp_thrust', { fadeIn: 0.04 });
    if (this.inst) {
      this.inst.time = 0.1;
      this.inst.speed = 0.25;
    }
    // the launch leaves a crater
    if (f.grounded) g.groundImpact(f.pos.clone(), 1.3, 120, f.def.aura.body, f);
    g.sfx.play('shunpo', f.center(), 1.2);
    f.ghosts.spawn(0.5, 1);
    f.bladeHits.clear();
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t < 0.42) {
      f.push.copy(this.dir).multiplyScalar(32);
      // bulldoze: whatever is ahead is smashed out of the way
      this.carveT -= dt;
      if (this.carveT <= 0) {
        this.carveT = 0.05;
        const a = f.center().addScaledVector(this.dir, 0.4);
        const b = a.clone().addScaledVector(this.dir, 1.6);
        g.engine.destruction.carve(new CapsuleShape(a, b, 1.05), { mode: 'smash', power: 260, impulse: 14, dust: 0.6 });
        f.ghosts.spawn(0.3, 0.7);
        const p = f.pos;
        g.engine.dust.spawn({ x: p.x, y: p.y + 0.1, z: p.z, vx: -this.dir.x * 4 + (Math.random() - 0.5) * 3, vy: Math.random() * 2, vz: -this.dir.z * 4 + (Math.random() - 0.5) * 3, size: 0.6, sizeEnd: 1.8, life: 0.6, r: 0.7, g: 0.66, b: 0.58, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 3 });
      }
      const r = strike(f, g, { damage: 44, knock: 24, launch: 5, heavy: true, reach: 1.1, height: 1.2, radius: 1.3, hitstop: 0.08, shake: 0.4 }, this.hits, this.kit.growthMul());
      if (r.landed) this.kit.landed(r.landed);
    } else if (this.t < 0.42 + dt * 1.5) f.push.multiplyScalar(0.25);
  }
  override end(f: Fighter): void {
    super.end(f);
    if (this.inst) this.inst.speed = 1.4;
  }
}

/** G: the eyepatch torn off and flung away. */
class EyepatchAction extends SkillAction {
  readonly name = 'eyepatch';
  constructor(kit: KenpachiKit) {
    super(kit);
    this.mobility = 0;
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter): void {
    this.playClip(f, 'kp_eyepatch', (n) => {
      if (n === 'rip') this.kit.unleash();
    });
  }
}

/** F: "Nome, Nozarashi" — the sword swells into the war-cleaver. */
class NomeAction extends SkillAction {
  readonly name = 'nome';
  constructor(kit: KenpachiKit) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'kp_nome', (n) => {
      if (n === 'raise') {
        f.aura.flare(1.3, 0.6);
        g.sfx.play('charge', f.center(), 1);
      }
      if (n === 'grow') this.kit.becomeShikai();
    });
  }
}

/** F again: Bankai. */
class BankaiAction extends SkillAction {
  readonly name = 'bankai';
  constructor(kit: KenpachiKit) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'kp_bankai', (n) => {
      if (n === 'charge') {
        f.aura.flare(1.6, 0.8);
        g.sfx.play('charge', f.center(), 1.2);
        g.shake(0.3);
      }
      if (n === 'burst') this.kit.becomeBankai();
    });
  }
}

/** RMB in Shikai: Meteor Cleaver — leap, the cleaver over the head, crash down. */
class MeteorAction extends SkillAction {
  readonly name = 'meteor';
  private struck = false;
  constructor(kit: KenpachiKit) {
    super(kit);
    this.mobility = 0;
    this.airGravity = 1;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = { damage: 70, knock: 14, launch: 5, heavy: true, hitstop: 0.12, shake: 0.6, cut: 900 };
    this.playClip(f, 'kp_meteor', (n) => {
      if (n === 'leap') {
        const tgt = f.faceTarget;
        const dist = tgt ? Math.min(14, Math.max(2, Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z) - 1.8)) : 6;
        f.push.addScaledVector(f.forward(), dist * 2.3);
        f.body.vel.y = 9;
        f.body.grounded = false;
        g.sfx.play('shunpo', f.center(), 1);
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.bladeActive = this.t >= 0.57 && this.t <= 0.72;
    if (f.trail) f.trail.emitting = this.t >= 0.54 && this.t <= 0.8;
    if (!this.struck && ((this.t >= 0.5 && f.grounded) || this.t >= 0.95)) {
      this.struck = true;
      this.kit.meteorCrash();
    }
  }
}

/** The AI's opener: "cut me anywhere" — arms spread, chest open. */
class TauntAction extends SkillAction {
  readonly name = 'taunt';
  constructor(kit: KenpachiKit) {
    super(kit);
    this.mobility = 0;
  }
  override start(f: Fighter): void {
    this.playClip(f, 'kp_taunt', () => {});
    this.dur = 2.3;
  }
}

// ------------------------------------------------------------------ the kit

export class KenpachiKit implements Kit {
  form: Form = 'sealed';
  patchOff = false;
  flare = false;
  /** consecutive landed hits: every one makes the next bigger */
  growth = 0;
  private growthT = 0;
  private surged = false;
  private lastClip = '';
  private chainIndex = 0;
  private lastEnd = 0;
  private growProp = 1;
  private cd = { heavy: 0, ryodan: 0, shock: 0, burst: 0 };
  readonly skull: SkullAura;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    this.skull = new SkullAura(g, f);
    g.addProjectile(this.skull);
    this.applyStats();
  }

  update(dt: number): void {
    const f = this.f;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.growthT > 0) {
      this.growthT -= dt;
      if (this.growthT <= 0) this.growth = 0;
    }
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    // the eyepatch devoured his reiryoku: without it, it comes back fast
    if (this.patchOff && !f.dead) f.rei = Math.min(f.maxRei, f.rei + dt * 3);
    // Bankai overload: the power tears at his own body
    if (this.form === 'bankai' && !f.dead) {
      f.hp = Math.max(1, f.hp - f.maxHp * 0.004 * dt);
      if (Math.random() < dt * 14) {
        const c = f.center();
        this.g.engine.dust.spawn({ x: c.x + (Math.random() - 0.5) * 0.6, y: c.y + (Math.random() - 0.3) * 1.2, z: c.z + (Math.random() - 0.5) * 0.6, vx: (Math.random() - 0.5) * 0.4, vy: 1.4 + Math.random(), vz: (Math.random() - 0.5) * 0.4, size: 0.25, sizeEnd: 0.9, life: 1.1, r: 0.85, g: 0.82, b: 0.8, alpha: 0.35, alphaEnd: 0, tex: TEX_PUFF, drag: 0.6 });
      }
    }
    // near death he comes back stronger
    if (!this.surged && !f.dead && f.hp < f.maxHp * 0.25) {
      this.surged = true;
      f.hp += f.maxHp * 0.1;
      f.aura.flare(2, 1);
      this.skull.flare(1.2, 1.5);
      this.g.sfx.play('flare', f.center());
      this.applyStats();
    }
    // the Shikai cleaver swells to full size
    if (this.growProp < 1) {
      this.growProp = Math.min(1, this.growProp + dt * 3.2);
      const s = f.visual.props.get('sword');
      if (s) s.scale.setScalar(0.3 + 0.7 * (1 - (1 - this.growProp) ** 3));
    }
  }

  // ---------------------------------------------------------------- string

  /** Damage multiplier of the string: every landed hit adds 8 % (up to ×1.8). */
  growthMul(): number {
    return 1 + 0.08 * Math.min(10, this.growth);
  }

  landed(n: number): void {
    this.growth = Math.min(10, this.growth + n);
    this.growthT = 1.8;
    if (this.growth >= 4) this.f.aura.flare(0.5 + this.growth * 0.06, 0.3);
    if (this.growth >= 7 && (this.patchOff || this.form !== 'sealed')) this.skull.flare(0.55, 0.4);
  }

  /** Swings cut far past the blade once the eyepatch is off, and in every release. */
  bigCuts(): boolean {
    return this.patchOff || this.form !== 'sealed';
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 80, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 80);
  }

  private pick(): string {
    if (this.form === 'shikai') return KENPACHI_SHIKAI_CHAIN[this.chainIndex++ % KENPACHI_SHIKAI_CHAIN.length];
    if (this.form === 'bankai') return KENPACHI_BANKAI_CHAIN[this.chainIndex++ % KENPACHI_BANKAI_CHAIN.length];
    // no pattern: anything but what he just did, the sword three times as often as a fist or a foot
    const pool = KENPACHI_POOL.filter((c) => c !== this.lastClip);
    const w = pool.map((c) => (c === 'kp_punch' || c === 'kp_kick' ? 1 : 3));
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < pool.length; i++) if ((r -= w[i]) <= 0) return pool[i];
    return pool[0];
  }

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof SwingAction && !cur.heavy) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.9) this.chainIndex = 0;
    this.chainNext();
  }

  chainNext(): void {
    const clip = this.pick();
    this.lastClip = clip;
    this.lastEnd = this.g.time + 0.9;
    this.f.act(new SwingAction(this, clip), true);
  }

  // ---------------------------------------------------------------- specials

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

  heavy(): void {
    if (this.form === 'sealed') this.special(new FlickAction(this), 10, 'heavy', 2.6);
    else if (this.form === 'shikai') this.special(new MeteorAction(this), 16, 'heavy', 3.5);
    else this.special(new RyodanAction(this, 'kp_bisect', true), 22, 'heavy', 4.5);
  }

  /** Q: Kendō — Ryōdan. */
  skill1(): void {
    this.special(new RyodanAction(this), 28, 'ryodan', 7);
  }

  /** E: reiatsu shock wave. */
  skill2(): void {
    this.special(new ShockAction(this), 22, 'shock', 6);
  }

  /** R: Leg Burst. */
  skill3(): void {
    this.special(new LegBurstAction(this, this.target()), 12, 'burst', 3.5);
  }

  /** G: the eyepatch comes off (for the rest of the fight). */
  toggle(): void {
    const f = this.f;
    if (this.patchOff || f.busy) return;
    f.act(new EyepatchAction(this), true);
  }

  release(): void {
    const f = this.f;
    if (this.form === 'bankai' || f.busy) return;
    const cost = this.form === 'sealed' ? 25 : 45;
    if (!f.spendRei(cost)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(this.form === 'sealed' ? new NomeAction(this) : new BankaiAction(this), true);
  }

  toggleFlare(): void {
    this.flare = !this.flare;
    this.applyStats();
    if (this.flare) {
      this.f.aura.flare(1.6, 0.4);
      if (this.patchOff || this.form !== 'sealed') this.skull.flare(1, 0.8);
      this.g.shake(0.2);
      this.g.sfx.play('flare', this.f.center());
    }
  }

  // ---------------------------------------------------------------- effects

  /**
   * A thin slab cut straight out in front: everything inside it is split (buildings slide apart) and
   * any enemy in its plane takes the hit. `tilt` 0 = horizontal, 90 = vertical.
   */
  private slab(len: number, width: number, tilt: number, power: number, damage: number, height: number, o: { from?: number; heavy?: boolean; flash?: string; skip?: Set<number> } = {}): void {
    const { f, g } = this;
    const fw = f.forward();
    const from = o.from ?? 0.8;
    const { q, across, normal } = slabQuat(fw, tilt);
    const c = f.pos.clone().addScaledVector(fw, from + len / 2);
    c.y += height;
    g.engine.destruction.carve(new BoxShape(c, new THREE.Vector3(len / 2, 0.08, width / 2), q), { mode: 'cut', power, dir: across.clone(), sparks: [1, 0.86, 0.4], dust: 0.5 });
    if (damage > 0)
      for (const o2 of g.enemiesOf(f)) {
        if (o.skip?.has(o2.id)) continue;
        _v.subVectors(o2.center(), c);
        const along = _v.dot(fw), side = _v.dot(across), off = Math.abs(_v.dot(normal));
        if (Math.abs(along) > len / 2 + o2.def.radius || Math.abs(side) > width / 2 + o2.def.radius || off > 0.9 + o2.def.radius) continue;
        o.skip?.add(o2.id);
        g.damage(o2, damage, f, fw.clone(), { knock: 10, launch: 2, heavy: o.heavy ?? true, hitstop: 0.08, shake: 0.4 });
        g.sparks(o2.center(), fw, o.flash ?? f.def.aura.body, 18);
      }
    g.addProjectile(new CutFlash(g, c, q, len, width, o.flash ?? f.def.aura.body));
  }

  /** Eyepatch off / released: each swing's cut continues far beyond the blade (half its damage out there). */
  reachCut(tilt: number, len: number, power: number, damage: number): void {
    const f = this.f;
    this.slab(len, tilt === 90 ? 5 : 3.2, tilt, power, damage, tilt === 90 ? 1.6 : 1.2, { from: 1.4, heavy: false, skip: f.bladeHits });
    this.g.sfx.play('swingHeavy', f.center(), 0.6);
  }

  /** The wrist flick: a horizontal slab through whatever stands in front. */
  buildingCut(len: number, width: number, tilt: number, damage: number): void {
    const { f, g } = this;
    this.slab(len, width, tilt, this.patchOff ? 1100 : 760, damage, 1.3, { heavy: true });
    g.sfx.play('swingHeavy', f.center(), 1.2);
    g.shake(f === g.player ? 0.25 : 0.1);
  }

  /** Ryōdan: one cut that splits the ground into a trench and tears everything along it in two. */
  ryodan(): void {
    const { f, g } = this;
    const fw = f.forward();
    const big = this.form !== 'sealed' ? 1.5 : this.patchOff ? 1.25 : 1;
    const len = 22 * big;
    const mul = this.growthMul();
    // the cut itself: a vertical blade of force down the line
    this.slab(len, 9 * big, 90, 1500 * big, 0, 3.4 * big, { from: 0.6 });
    // the trench
    const tc = f.pos.clone().addScaledVector(fw, 0.8 + len / 2);
    tc.y -= 0.5;
    const { q } = slabQuat(fw, 0);
    g.engine.destruction.carve(new BoxShape(tc, new THREE.Vector3(len / 2, 1.2 * big, 0.65 * big), q), { mode: 'smash', power: 600 * big, impulse: 16, dust: 0.9 });
    const tip = f.pos.clone().addScaledVector(fw, 2.2);
    g.groundImpact(tip, 2.2 * big, 240 * big, f.def.aura.body, f);
    // whoever is in front takes the full cut, anyone down the line the wave
    const right = new THREE.Vector3(-fw.z, 0, fw.x);
    for (const o of g.enemiesOf(f)) {
      _v.subVectors(o.pos, f.pos);
      const along = _v.dot(fw), side = Math.abs(_v.dot(right));
      if (along < -0.5 || along > len + 1) continue;
      if (along < 5 && side < 1.6 + o.def.radius) g.damage(o, 120 * mul, f, fw.clone(), { knock: 20, launch: 6, heavy: true, hitstop: 0.16, shake: 0.9 });
      else if (side < 1.2 + o.def.radius) g.damage(o, 55 * mul, f, fw.clone(), { knock: 14, launch: 7, heavy: true });
    }
    // the sand wall thrown up along the trench
    for (let i = 0; i < 28; i++) {
      const d = 1.5 + (i / 28) * len;
      const p = f.pos.clone().addScaledVector(fw, d);
      for (const s of [-1, 1])
        g.engine.dust.spawn({ x: p.x + right.x * s * 0.8, y: p.y + 0.2, z: p.z + right.z * s * 0.8, vx: right.x * s * (1 + Math.random() * 2), vy: 5 + Math.random() * 7, vz: right.z * s * (1 + Math.random() * 2), size: 0.9, sizeEnd: 2.8, life: 1.2 + Math.random() * 0.6, r: 0.66, g: 0.6, b: 0.5, alpha: 0.6, alphaEnd: 0, tex: TEX_PUFF, gravity: -6, drag: 1.2 });
      g.engine.glow.spawn({ x: p.x, y: p.y + 0.3 + Math.random() * 2, z: p.z, vx: 0, vy: 4 + Math.random() * 3, vz: 0, size: 0.3, sizeEnd: 0.04, life: 0.5, r: 1, g: 0.88, b: 0.4, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
    }
    g.callout('両断', 'RYŌDAN', '#ffe066');
    g.sfx.play('explode', tip, 1.4);
    g.shake(0.9);
    g.hitstop(0.08);
    g.slowMo(0.25, 0.35);
    g.engine.gr.chroma.offset.set(0.006, 0.006);
    this.skull.flare(this.bigCuts() ? 1.4 : 0.7, 0.9);
  }

  /** Bankai: one vertical cut at a distance that splits everything on the line. */
  distantBisection(): void {
    const { f, g } = this;
    const len = 64;
    this.slab(len, 22, 90, 2600, 150 * this.growthMul(), 8, { from: 1, flash: '#FF8A3A' });
    g.engine.destruction.carve(new BoxShape(f.pos.clone().addScaledVector(f.forward(), 1 + len / 2).setY(f.pos.y - 0.4), new THREE.Vector3(len / 2, 1.4, 0.5), slabQuat(f.forward(), 0).q), { mode: 'smash', power: 700, impulse: 14, dust: 0.8 });
    g.sfx.play('explode', f.center(), 1.6);
    g.shake(1);
    g.hitstop(0.1);
    g.slowMo(0.3, 0.35);
    g.engine.gr.chroma.offset.set(0.008, 0.008);
    this.skull.flare(1.5, 1);
  }

  /** E: everything around him blown away by raw reiatsu. */
  shockWave(): void {
    const { f, g } = this;
    const R = this.form === 'bankai' ? 14 : this.form === 'shikai' ? 12 : this.patchOff ? 11 : 8;
    const col = f.def.aura.body;
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d > R) continue;
      const k = 1 - d / R;
      g.damage(o, (24 + 46 * k) * this.growthMul(), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 8 + 22 * k, launch: 4 + 5 * k, heavy: true, hitstop: 0.1 });
    }
    g.engine.destruction.carve(new SphereShape(f.center(), R * 0.28), { mode: 'smash', power: 180, impulse: 18, dust: 0.8 });
    g.addRing(f.pos.clone(), R, col, 0.6);
    g.addRing(f.pos.clone().setY(f.pos.y + 1.2), R * 0.7, '#FFF2B3', 0.45);
    const c = f.center();
    const cc = new THREE.Color(col);
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2;
      g.engine.dust.spawn({ x: f.pos.x, y: f.pos.y + 0.3, z: f.pos.z, vx: Math.cos(a) * (12 + Math.random() * 8), vy: Math.random() * 2, vz: Math.sin(a) * (12 + Math.random() * 8), size: 0.9, sizeEnd: 3, life: 1.1, r: 0.72, g: 0.66, b: 0.55, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 2.2 });
      g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: Math.cos(a) * 16, vy: (Math.random() - 0.3) * 6, vz: Math.sin(a) * 16, size: 0.35, sizeEnd: 0.05, life: 0.45, r: cc.r, g: cc.g, b: cc.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 2 });
    }
    g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 1.5, sizeEnd: R * 1.4, life: 0.35, r: cc.r, g: cc.g, b: cc.b, alpha: 0.9, alphaEnd: 0, tex: TEX_RING });
    f.aura.flare(1.8, 0.6);
    this.skull.flare(this.bigCuts() ? 1.3 : 0.8, 1.1);
    g.sfx.play('explode', c, 1.3);
    g.shake(0.7);
    g.hitstop(0.06);
    g.engine.gr.chroma.offset.set(0.005, 0.005);
  }

  /** Shikai heavy landing: crater, a vertical split ahead, everything near thrown. */
  meteorCrash(): void {
    const { f, g } = this;
    const fw = f.forward();
    const p = f.pos.clone().addScaledVector(fw, 2);
    g.groundImpact(p, 3.8, 320, f.def.aura.body, f);
    this.slab(14, 7, 90, 1300, 0, 3, { from: 1.2 });
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(p);
      if (d < 4.2) g.damage(o, 95 * this.growthMul(), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 18, launch: 9, heavy: true, hitstop: 0.14, shake: 0.8 });
    }
    g.sfx.play('explode', p, 1.5);
    g.shake(0.8);
    g.slowMo(0.18, 0.4);
    this.skull.flare(1.2, 0.8);
  }

  // ---------------------------------------------------------------- states and forms

  /** "Ken-chan's getting serious": Yachiru jumps down to watch from a safe distance. */
  dismount(): void {
    const { f, g } = this;
    const m = f.visual.props.get('rider');
    if (!m) return;
    m.updateWorldMatrix(true, false);
    const p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
    m.matrixWorld.decompose(p, q, sc);
    f.visual.props.delete('rider');
    m.removeFromParent();
    m.position.copy(p);
    m.quaternion.copy(q);
    m.scale.copy(sc);
    g.engine.gr.scene.add(m);
    const fw = f.forward();
    g.addProjectile(new Dismount(g, m, new THREE.Vector3(fw.z, 0, -fw.x).addScaledVector(fw, -0.6).normalize()));
  }

  /** The eyepatch comes off: it is flung away, a helix of gold climbs into the sky, the skull appears. */
  unleash(): void {
    const { f, g } = this;
    if (this.patchOff) return;
    this.patchOff = true;
    this.dismount();
    const patch = f.visual.props.get('patch');
    if (patch) {
      patch.updateWorldMatrix(true, false);
      const fw = f.forward();
      const left = new THREE.Vector3(fw.z, 0, -fw.x);
      const r = KENPACHI_RES;
      const shard = { model: kenpachiProp('eyepatch'), center: [-2.6 / r, 1.2 / r, 1 / r] as [number, number, number], voxels: 0 };
      const origin = new THREE.Vector3(...shard.center).applyMatrix4(patch.matrixWorld).addScaledVector(left, -0.3);
      g.addProjectile(new ShardBurst(g, [shard], patch.matrixWorld, { origin, dir: left.addScaledVector(fw, 0.3).normalize(), speed: 6, life: 3, dust: '#2a2a2e' }));
      f.visual.detach('patch');
    }
    f.aura.pillarBurst(2.8);
    f.aura.flare(2.2, 1.2);
    this.skull.flare(1.5, 2.2);
    g.callout('眼帯', 'THE EYEPATCH COMES OFF', '#ffe066');
    g.sfx.play('flare', f.center(), 1.4);
    g.sfx.play('explode', f.center(), 0.8);
    g.shake(0.8);
    g.hitstop(0.08);
    g.slowMo(0.4, 0.3);
    g.engine.gr.chroma.offset.set(0.006, 0.006);
    // the released reiatsu alone blows everything back
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d < 12) g.damage(o, 16 * (1 - d / 12), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 18 * (1 - d / 12), launch: 4, heavy: true });
    }
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.dust.spawn({ x: f.pos.x, y: f.pos.y + 0.3, z: f.pos.z, vx: Math.cos(a) * (9 + Math.random() * 8), vy: Math.random() * 2, vz: Math.sin(a) * (9 + Math.random() * 8), size: 0.8, sizeEnd: 2.6, life: 1.2, r: 0.75, g: 0.7, b: 0.58, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    }
    this.applyStats();
  }

  becomeShikai(): void {
    const { f, g } = this;
    if (this.form !== 'sealed') return;
    this.form = 'shikai';
    this.dismount();
    f.visual.attach('sword', kenpachiProp('cleaver'), 'grip.R');
    this.growProp = 0;
    f.visual.props.get('sword')!.scale.setScalar(0.3);
    f.anim.loco.stance = KENPACHI_SHIKAI_STANCE;
    f.def = { ...f.def, stance: KENPACHI_SHIKAI_STANCE, blade: BLADE_CLEAVER };
    f.bladeValid = false;
    f.aura.pillarBurst(2.4);
    f.aura.flare(2, 1);
    this.skull.flare(1.4, 1.6);
    g.callout('呑め「野晒」', 'NOME, NOZARASHI', '#ffe066');
    g.sfx.play('bankai', f.center(), 0.9);
    g.shake(0.8);
    g.slowMo(0.4, 0.35);
    g.engine.gr.chroma.offset.set(0.006, 0.006);
    const s = f.visual.props.get('sword')!;
    s.updateWorldMatrix(true, false);
    const p = new THREE.Vector3(0, -0.3, 1.2).applyMatrix4(s.matrixWorld);
    for (let i = 0; i < 40; i++)
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 8, vy: Math.random() * 6, vz: (Math.random() - 0.5) * 8, size: 0.25, sizeEnd: 0.03, life: 0.7, r: 1, g: 0.86, b: 0.35, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2.5, drag: 2 });
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d < 10) g.damage(o, 20 * (1 - d / 10), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 16 * (1 - d / 10), launch: 4, heavy: true });
    }
    this.applyStats();
  }

  /** The oni: crimson skin, horns, a jagged blade; the ground under him turns molten. */
  becomeBankai(): void {
    const { f, g } = this;
    if (this.form === 'bankai') return;
    this.form = 'bankai';
    f.def = { ...f.def, stance: KENPACHI_BANKAI_STANCE, speed: { ...SPEED_BANKAI } };
    f.setForm({ asset: kenpachiAsset('bankai'), props: [{ key: 'sword', model: kenpachiProp('bankai-blade'), socket: 'grip.R' }] }, AURA_KENPACHI_BANKAI, BLADE_BANKAI);
    this.growProp = 1;
    this.patchOff = true;
    f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.3);
    this.skull.setColor(EMBER, '#FFE2B0');
    f.aura.pillarBurst(3);
    f.aura.flare(2.4, 1.4);
    this.skull.flare(1.6, 2);
    g.callout('卍解', 'BANKAI', '#ff7a2a');
    g.sfx.play('bankai', f.center(), 1.3);
    g.groundImpact(f.pos.clone(), 3.4, 220, EMBER, f);
    g.addRing(f.pos.clone(), 18, EMBER, 0.9);
    g.shake(1);
    g.hitstop(0.1);
    g.slowMo(0.5, 0.3);
    g.engine.gr.chroma.offset.set(0.008, 0.008);
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d < 16) g.damage(o, 35 * (1 - d / 16), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 26 * (1 - d / 16), launch: 7, heavy: true });
    }
    // molten ground: embers and glowing splashes round his feet
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * 4;
      g.engine.glow.spawn({ x: f.pos.x + Math.cos(a) * r, y: f.pos.y + 0.1, z: f.pos.z + Math.sin(a) * r, vx: Math.cos(a) * 2, vy: 3 + Math.random() * 6, vz: Math.sin(a) * 2, size: 0.18, sizeEnd: 0.04, life: 1 + Math.random(), r: 1, g: 0.42 + Math.random() * 0.3, b: 0.1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, gravity: -6 });
    }
    this.applyStats();
  }

  private applyStats(): void {
    const f = this.f;
    const formMul = this.form === 'bankai' ? 2.1 : this.form === 'shikai' ? 1.5 : 1;
    f.power = formMul * (this.patchOff && this.form === 'sealed' ? 1.4 : this.patchOff ? 1.1 : 1) * (this.flare ? 1.25 : 1) * (this.surged ? 1.2 : 1);
    f.toughness = this.form === 'bankai' ? 30 : this.form === 'shikai' ? 22 : this.patchOff ? 18 : 12;
    // monstrous endurance: he fights on impaled and half-beheaded
    f.damageTaken = this.form === 'bankai' ? 0.7 : this.form === 'shikai' ? 0.75 : this.patchOff ? 0.8 : 0.85;
    f.aura.target = this.flare ? 0.9 : this.form === 'bankai' ? 0.5 : this.patchOff ? 0.38 : this.form === 'shikai' ? 0.3 : 0.12;
    this.skull.target = this.bigCuts() ? (this.flare ? 0.75 : 0.14) : 0;
  }

  /** "Cut me anywhere." */
  taunt(): void {
    if (!this.f.busy) this.f.act(new TauntAction(this));
  }

  formName(): string {
    return this.form === 'bankai' ? 'Bankai' : this.form === 'shikai' ? 'Shikai — Nozarashi' : this.patchOff ? 'Captain, 11th Division — unbound' : 'Captain, 11th Division';
  }

  ai(): KitAI {
    return {
      reach: 1.9,
      chain: 4,
      releaseAt: [0.45, 0.22],
      toggleAt: 0.62,
      toggleOn: () => this.patchOff,
      opener: () => this.taunt(),
      moves: [
        { name: 'ryodan', use: () => this.skill1(), min: 0, max: 4, weight: 1.4, cd: 7 },
        { name: 'shock', use: () => this.skill2(), min: 0, max: 5.5, weight: 1, cd: 8 },
        { name: 'legburst', use: () => this.skill3(), min: 5, max: 24, weight: 2.4, cd: 4 },
        { name: 'flick', use: () => this.heavy(), min: 2.5, max: this.patchOff ? 26 : 15, weight: 1.6, cd: 4, when: () => this.form === 'sealed' },
        { name: 'meteor', use: () => this.heavy(), min: 3, max: 13, weight: 1.6, cd: 5, when: () => this.form === 'shikai' },
        { name: 'bisect', use: () => this.heavy(), min: 4, max: 50, weight: 1.8, cd: 6, when: () => this.form === 'bankai' },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const fm = this.form;
    const list: AbilityInfo[] = [
      { key: 'LMB', name: fm === 'sealed' ? 'No pattern' : fm === 'shikai' ? 'Cleaver' : 'Oni hacks', kanji: '斬' },
      fm === 'sealed'
        ? { key: 'RMB', name: 'Building cutter', kanji: '断', cost: 10, cd: this.cd.heavy, cdMax: 2.6 }
        : fm === 'shikai'
          ? { key: 'RMB', name: 'Meteor cleaver', kanji: '隕', cost: 16, cd: this.cd.heavy, cdMax: 3.5 }
          : { key: 'RMB', name: 'Bisection', kanji: '断', cost: 22, cd: this.cd.heavy, cdMax: 4.5 },
      { key: 'Q', name: 'Ryōdan', kanji: '両断', cost: 28, cd: this.cd.ryodan, cdMax: 7 },
      { key: 'E', name: 'Shock wave', kanji: '衝', cost: 22, cd: this.cd.shock, cdMax: 6 },
      { key: 'R', name: 'Leg burst', kanji: '突', cost: 12, cd: this.cd.burst, cdMax: 3.5 },
      { key: 'Shift', name: 'Dash', kanji: '駆', cost: 4 },
      { key: 'G', name: 'Eyepatch', kanji: '眼帯', active: this.patchOff, tint: '#ffe066' },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      { key: 'F', name: fm === 'sealed' ? 'Shikai' : 'Bankai', kanji: fm === 'sealed' ? '始解' : '卍解', cost: fm === 'sealed' ? 25 : 45, active: fm === 'bankai', tint: '#ffe066' },
    ];
    return list;
  }
}
