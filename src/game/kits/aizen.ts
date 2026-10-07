// Aizen's kit (docs/roster/B2-captains-2.md §Aizen). Captain: small, exact cuts with Kyōka Suigetsu
// hanging low; the passing stroke whose wound opens after he has already gone by; incantation-less Kidō —
// Hadō #90 Kurohitsugi, Hadō #63 Raikōhō; Kyōka Suigetsu's complete hypnosis — the Aizen everyone is
// looking at is a reflection, the real one is already behind them; a single raised finger stops a blade.
// G: the reveal — the glasses crushed, the hair swept back. F: the Hōgyoku — the white Chrysalis, the
// fused blade, instant regeneration, the fully incanted Kurohitsugi and Hadō #99 Goryūtenmetsu.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { DamageOpts, Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { FUSED_ATTACH, aizenAsset, aizenProp, type AizenForm } from '../../chars/aizen';
import { AIZEN_CHAIN, AIZEN_CLIPS, AIZEN_STANCE, CHRYSALIS_CHAIN, CHRYSALIS_STANCE } from '../../chars/aizenClips';
import { CeroBeam } from '../projectiles/cero';
import { BlackCoffin } from '../../vfx/kurohitsugi';
import { DragonStrike } from '../../vfx/serpent';
import { GlassShards, MirrorDecoy } from '../../vfx/mirror';
import { ShardBurst } from '../../vfx/shards';
import { shatterModel, type Shattered } from '../../models/shatter';
import { BoxShape } from '../../destruction/shapes';
import { raycastVoxels } from '../../voxel/raycast';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

export const AURA_AIZEN: AuraStyle = { core: '#E9E4FF', body: '#7F3FD8', rim: '#3C1670' };
export const AURA_HOGYOKU: AuraStyle = { core: '#F2EEFF', body: '#9B4DFF', rim: '#3C1670' };
const VIOLET = '#9B4DFF';

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE_KYOKA: BladeDef = { prop: 'sword', base: [0, 0, 0.14], tip: [0, 0, 0.85], color: '#C9B6FF', core: '#F2EEFF' };
const BLADE_FUSED: BladeDef = { prop: 'sword', base: [0, 0, 0.1], tip: [0, 0, 0.9], color: '#B57DFF', core: '#F2EEFF' };
const FUSED_ROT = new THREE.Euler(...FUSED_ATTACH);

export const AIZEN_DEF: FighterDef = {
  id: 'aizen',
  name: 'Sōsuke Aizen',
  title: 'Captain, 5th Division',
  build: () => ({
    asset: aizenAsset('captain'),
    props: [
      { key: 'sword', model: aizenProp('katana'), socket: 'grip.R' },
      { key: 'sheath', model: aizenProp('sheath-empty'), socket: 'hip.L' },
      { key: 'glasses', model: aizenProp('glasses'), socket: 'glasses' },
    ],
  }),
  stance: AIZEN_STANCE,
  clips: AIZEN_CLIPS,
  aura: AURA_AIZEN,
  blade: BLADE_KYOKA,
  hp: 1150,
  rei: 150,
  speed: { run: 9.5, sprint: 25, jump: 12, dash: 15, dashTime: 0.1 },
  radius: 0.4,
  height: 1.86,
};

const SPEED_CHRYSALIS = { run: 11, sprint: 29, jump: 14, dash: 18, dashTime: 0.09 };

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();

interface MoveInfo {
  lunge: number;
  window: [number, number];
  trail: [number, number];
  spec: BladeSpec;
}

const MOVES: Record<string, MoveInfo> = {
  az_cut1: { lunge: 7, window: [0.08, 0.21], trail: [0.06, 0.26], spec: { damage: 22, knock: 7, launch: 0, hitstop: 0.04, shake: 0.1, cut: 320 } },
  az_cut2: { lunge: 7, window: [0.09, 0.23], trail: [0.07, 0.28], spec: { damage: 24, knock: 7, launch: 3, hitstop: 0.045, shake: 0.12, cut: 320 } },
  az_cut3: { lunge: 9, window: [0.1, 0.2], trail: [0.08, 0.24], spec: { damage: 32, knock: 16, launch: 1, heavy: true, hitstop: 0.08, shake: 0.3, cut: 360 } },
  az_ch1: { lunge: 9, window: [0.07, 0.19], trail: [0.05, 0.23], spec: { damage: 34, knock: 10, launch: 2, hitstop: 0.05, shake: 0.18, cut: 560 } },
  az_ch2: { lunge: 9, window: [0.07, 0.19], trail: [0.05, 0.23], spec: { damage: 34, knock: 10, launch: 2, hitstop: 0.05, shake: 0.18, cut: 560 } },
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

/** The sword hand closed, the left hand open (the finger, the Kidō). */
function setHands(f: Fighter): void {
  const rig = f.visual.rig;
  rig.setBoneVisible('fist.R', true);
  rig.setBoneVisible('palm.R', false);
  rig.setBoneVisible('fist.L', false);
  rig.setBoneVisible('palm.L', true);
}

/** Teleport (Shunpo / the illusion): no interpolation streak, no swept blade across the gap. */
function teleport(f: Fighter, p: THREE.Vector3): void {
  f.body.pos.copy(p);
  f.body.prev.copy(p);
  f.body.vel.set(0, 0, 0);
  f.push.set(0, 0, 0);
  f.bladeValid = false;
}

/** How far f can travel from `from` along `dir` before a wall (keeps a margin). */
function clearance(g: Game, from: THREE.Vector3, dir: THREE.Vector3, want: number): number {
  const hit = raycastVoxels(g.engine.world, from.x, from.y + 1, from.z, dir.x, 0, dir.z, want + 0.6);
  return hit ? Math.max(0, hit.dist - 0.6) : want;
}

// ------------------------------------------------------------------ the strings

class StringAction extends FighterAction {
  readonly name: string;
  private info: MoveInfo;
  private dur = 0;
  private comboAt = 0;
  queued = false;

  constructor(readonly kit: AizenKit, readonly clip: string, readonly index: number) {
    super();
    this.name = clip;
    this.info = MOVES[clip];
    this.mobility = 0.12;
    this.airGravity = 0.1;
  }

  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    f.bladeHits.clear();
    f.bladeSpec = this.info.spec;
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n !== 'step') return;
        const tgt = f.faceTarget;
        const extra = tgt ? Math.min(5, Math.max(0, f.pos.distanceTo(tgt) - 1.7)) : 0;
        f.push.addScaledVector(f.forward(), this.info.lunge + extra * 2.2);
        g.sfx.play(this.info.spec.heavy ? 'swingHeavy' : 'swing', f.center(), 0.75);
      },
    });
  }

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t, info = this.info;
    f.bladeActive = t >= info.window[0] && t <= info.window[1];
    if (f.trail) f.trail.emitting = t >= info.trail[0] && t <= info.trail[1];
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
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= this.info.window[0] + 0.04;
    return false;
  }
}

abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: AizenKit) {
    super();
  }
  protected playClip(f: Fighter, clip: string, onEvent: (n: string) => void, at = 0): void {
    const c = f.anim.clip(clip)!;
    this.dur = c.dur - c.fadeOut * 0.5 - at;
    const inst = f.anim.play(clip, { onEvent, fadeIn: at > 0 ? 0.02 : undefined });
    if (inst && at > 0) inst.time = at;
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

/**
 * RMB: the passing stroke. One step and he is already past the target, blade low and level behind
 * him; for a heartbeat nothing happens — then the cut opens.
 */
class PassAction extends SkillAction {
  readonly name = 'pass';
  private dir = new THREE.Vector3();
  private from = new THREE.Vector3();
  private to = new THREE.Vector3();
  private passed = false;
  private opened = false;
  private victims: Fighter[] = [];
  constructor(kit: AizenKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0;
    this.trackTarget = false;
    this.invulnerable = true;
    this.airGravity = 0;
  }
  override start(f: Fighter, g: Game): void {
    const t = this.target;
    this.from.copy(f.pos);
    if (t) this.dir.subVectors(t.pos, f.pos).setY(0);
    if (!t || this.dir.lengthSq() < 0.01) f.forward(this.dir);
    this.dir.normalize();
    const want = t ? Math.hypot(t.pos.x - f.pos.x, t.pos.z - f.pos.z) + 2.4 : 7;
    const go = clearance(g, f.pos, this.dir, want);
    this.to.copy(f.pos).addScaledVector(this.dir, go);
    if (t) this.to.y = Math.max(f.pos.y, t.pos.y);
    f.yaw = Math.atan2(this.dir.x, this.dir.z);
    this.playClip(f, 'az_pass', () => {});
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.passed && this.t >= 0.11) {
      this.passed = true;
      // the afterimages trace the line he took
      const o = f.visual.object;
      for (let i = 1; i <= 4; i++) {
        o.position.lerpVectors(this.from, this.to, i / 5);
        f.ghosts.spawn(0.35, 0.7);
      }
      teleport(f, this.to);
      g.onDash(f);
      // everyone on that line is already cut — they just don't know it yet
      const ab = _v.subVectors(this.to, this.from);
      const len2 = Math.max(1e-4, ab.lengthSq());
      for (const e of g.enemiesOf(f)) {
        const u = Math.max(0, Math.min(1, _w.subVectors(e.pos, this.from).dot(ab) / len2));
        const px = this.from.x + ab.x * u, pz = this.from.z + ab.z * u;
        if (Math.hypot(e.pos.x - px, e.pos.z - pz) < 1.3 + e.def.radius && Math.abs(e.pos.y - (this.from.y + ab.y * u)) < 2) this.victims.push(e);
      }
      // a hairline of light along the stroke
      const glow = g.engine.glow;
      for (let i = 0; i < 16; i++) {
        const p = _w.lerpVectors(this.from, this.to, i / 15);
        glow.spawn({ x: p.x, y: p.y + 1.0 + i * 0.012, z: p.z, size: 0.06, sizeEnd: 0.02, life: 0.5, r: 0.95, g: 0.92, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 6, vx: this.dir.x * 0.5, vy: 0, vz: this.dir.z * 0.5 });
      }
      if (f.trail) f.trail.emitting = true;
    }
    if (this.t > 0.2) {
      this.invulnerable = false;
      if (f.trail) f.trail.emitting = false;
    }
    if (this.passed && !this.opened && this.t >= 0.46) {
      this.opened = true;
      let any = false;
      for (const e of this.victims) {
        if (e.dead) continue;
        any = true;
        const c = e.center();
        g.damage(e, 62, f, this.dir.clone(), { knock: 9, launch: 4, heavy: true, hitstop: 0.12, shake: 0.5 });
        g.sparks(c, this.dir, '#E9E4FF', 22);
        // the wound opens as a diagonal flash
        const right = new THREE.Vector3(-this.dir.z, 0, this.dir.x);
        for (let i = 0; i < 10; i++) {
          const k = (i / 9 - 0.5) * 1.1;
          g.engine.glow.spawn({ x: c.x + right.x * k, y: c.y - k * 0.6, z: c.z + right.z * k, size: 0.16, sizeEnd: 0.02, life: 0.3, r: 1, g: 0.95, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
        }
      }
      // and the stroke cuts whatever stood on the line
      const mid = new THREE.Vector3().addVectors(this.from, this.to).multiplyScalar(0.5);
      mid.y += 1.0;
      const len = this.from.distanceTo(this.to);
      const right = new THREE.Vector3(-this.dir.z, 0, this.dir.x);
      const up = new THREE.Vector3(0, 1, 0).applyAxisAngle(this.dir, 0.35);
      _m.makeBasis(this.dir, up, right.applyAxisAngle(this.dir, 0.35));
      _q.setFromRotationMatrix(_m);
      g.engine.destruction.carve(new BoxShape(mid, new THREE.Vector3(len * 0.5 + 0.6, 0.06, 1.1), _q.clone()), { mode: 'cut', power: 650, dir: right, sparks: [0.85, 0.8, 1], dust: 0.4 });
      g.sfx.play(any ? 'hitHeavy' : 'swingHeavy', f.center(), 0.9);
    }
  }
}

/** Incantation-less Kidō: Kurohitsugi, Raikōhō — and from the Chrysalis, Goryūtenmetsu. */
class KidoAction extends SkillAction {
  readonly name: string;
  constructor(kit: AizenKit, readonly kind: 'kurohitsugi' | 'raikoho' | 'dragons', readonly target: Fighter | null) {
    super(kit);
    this.name = kind;
    this.mobility = 0.05;
    this.airGravity = 0.03;
    this.armor = kind === 'dragons' ? 0.5 : 0.3;
  }
  override start(f: Fighter, g: Game): void {
    const k = this.kind;
    const chrys = this.kit.form === 'chrysalis';
    this.playClip(f, k === 'kurohitsugi' ? 'az_kurohitsugi' : k === 'raikoho' ? 'az_raikoho' : 'az_dragons', (n) => {
      const t = this.target && !this.target.dead ? this.target : null;
      if (k === 'dragons' && n === 'raise') {
        const target = t;
        const last = aim(f, g);
        g.addProjectile(new DragonStrike(g, f, () => (target && !target.dead ? last.copy(target.center()) : last), 70, 1.3));
        g.callout('五龍転滅', 'HADŌ #99 — GORYŪTENMETSU', '#e3d3ff');
        f.aura.flare(2.2, 1.6);
        g.slowMo(0.3, 0.5);
      }
      if (n !== 'cast') return;
      if (k === 'kurohitsugi') {
        const scale = chrys ? 2.3 : 1;
        const at = t ? t.pos.clone() : aim(f, g);
        at.y += 1.2 * scale;
        g.addProjectile(new BlackCoffin(g, f, t, at, chrys ? 280 : 150, scale, chrys ? 0.7 : 0.5, chrys ? 1.6 : 1.3));
        if (chrys) g.callout('黒棺 · 完全詠唱', 'HADŌ #90 — KUROHITSUGI, FULLY INCANTED', '#b57dff');
        else g.callout('黒棺', 'HADŌ #90 — KUROHITSUGI', '#b57dff');
        f.aura.flare(1.4, 0.8);
        g.sfx.play('charge', f.center(), 0.7);
      } else if (k === 'raikoho') {
        const emitter = f.visual.rig.sockets.get('palm.L')!;
        g.addProjectile(new CeroBeam(g, f, emitter, () => aim(f, g, new THREE.Vector3()), { charge: 0.12, fire: 0.36, radius: 0.55, damage: 82, power: 380, core: '#FFFBE6', body: '#FFE05A', rim: '#D9A400', range: 85, track: 1.4, gain: 1.4 }));
        g.callout('雷吼炮', 'HADŌ #63 — RAIKŌHŌ', '#ffe066');
        g.sfx.play('charge', f.center(), 0.5);
      }
    });
  }
}

/**
 * R: Kyōka Suigetsu. What the enemy sees stays where it was — a perfect copy, frozen — while the real
 * Aizen, unseen and untouchable, walks round behind them. The copy shatters like a mirror as he cuts.
 */
class IllusionAction extends SkillAction {
  readonly name = 'illusion';
  private decoy: MirrorDecoy | null = null;
  private shownAt = -1;
  constructor(kit: AizenKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0;
    this.invulnerable = true;
    this.trackTarget = false;
    this.airGravity = 0;
  }
  override start(f: Fighter, g: Game): void {
    this.dur = 99;
    this.decoy = new MirrorDecoy(g, f, 3);
    g.addProjectile(this.decoy);
    this.kit.hide(true);
    f.lure = this.decoy.pos;
    g.sfx.play('shunpo', f.center(), 0.25);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const d = this.decoy!;
    if (this.shownAt < 0 && (this.t >= 0.85 || (d.touched && this.t > 0.15))) {
      this.shownAt = this.t;
      const t = this.target && !this.target.dead ? this.target : null;
      const p = new THREE.Vector3();
      if (t) {
        // directly behind them, already mid-cut
        const back = t.forward().multiplyScalar(-1);
        const go = clearance(g, t.pos, back, 1.4);
        p.copy(t.pos).addScaledVector(back, Math.max(0.8, go));
        f.yaw = Math.atan2(t.pos.x - p.x, t.pos.z - p.z);
      } else p.copy(d.pos).addScaledVector(f.forward(_v), 5);
      teleport(f, p);
      this.kit.hide(false);
      f.lure = null;
      d.shatter();
      g.callout('鏡花水月', 'KYŌKA SUIGETSU', '#c9b6ff');
      g.slowMo(0.22, 0.45);
      f.bladeHits.clear();
      f.bladeSpec = { damage: 72, knock: 14, launch: 4, heavy: true, hitstop: 0.12, shake: 0.5, cut: 520 };
      const chrys = this.kit.form === 'chrysalis';
      const inst = f.anim.play(chrys ? 'az_ch1' : 'az_cut1', { fadeIn: 0.02 });
      if (inst) inst.time = chrys ? 0.05 : 0.07;
      g.sfx.play('swingHeavy', f.center(), 1);
    }
    if (this.shownAt >= 0) {
      const lt = this.t - this.shownAt;
      if (lt > 0.12) this.invulnerable = false;
      f.bladeActive = lt > 0.01 && lt < 0.16;
      if (f.trail) f.trail.emitting = lt < 0.22;
      if (lt > 0.55) this.done = true;
    }
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.hide(false);
    f.lure = null;
    this.decoy?.shatter();
  }
}

/** The passive: one raised finger, and the blade stops on its tip. */
class FingerAction extends SkillAction {
  readonly name = 'finger';
  constructor(kit: AizenKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 1;
  }
  override start(f: Fighter): void {
    this.playClip(f, 'az_finger', () => {});
    this.dur = 0.6;
  }
  override canCancel(next: FighterAction): boolean {
    return this.t > 0.22 || next.name === 'dash';
  }
}

/** G: the reveal. The glasses come off and are crushed in the hand; the hair is swept back. */
class RevealAction extends SkillAction {
  readonly name = 'reveal';
  constructor(kit: AizenKit) {
    super(kit);
    this.mobility = 0.3;
    this.trackTarget = false;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'az_reveal', (n) => {
      if (n === 'glasses') f.visual.moveProp('glasses', 'palm.L', new THREE.Vector3(0, -0.02, 0.02), new THREE.Euler(0, 0, Math.PI / 2));
      if (n === 'crush') this.kit.crushGlasses();
      if (n === 'sweep') this.kit.becomeTraitor();
    });
  }
  override end(f: Fighter): void {
    super.end(f);
    // interrupted with the glasses in hand: they go back on
    if (this.kit.form === 'captain' && f.visual.props.has('glasses')) f.visual.moveProp('glasses', 'glasses', new THREE.Vector3(), new THREE.Euler());
  }
}

/** The AI's opener: Kyōka Suigetsu raised upright before his face — "Kudakero". */
class KudakeroAction extends SkillAction {
  readonly name = 'kudakero';
  constructor(kit: AizenKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'az_kudakero', (n) => {
      if (n !== 'shatter') return;
      const { base, tip } = f.blade;
      const c = new THREE.Vector3().addVectors(base, tip).multiplyScalar(0.5);
      g.addProjectile(new GlassShards(g, c, new THREE.Vector3(0.25, 0.4, 0.25), 46, 4.5, 1.6, f.pos.y, '#B9A6FF', 0.8));
      g.sfx.play('shatter', c, 0.9);
      g.callout('砕けろ「鏡花水月」', 'KUDAKERO, KYŌKA SUIGETSU', '#c9b6ff');
      f.aura.flare(1.2, 0.8);
      g.engine.gr.chroma.offset.set(0.004, 0.004);
    });
  }
}

/** F: the Hōgyoku awakens — a cocoon of white reiatsu, then the Chrysalis. */
class AwakenAction extends SkillAction {
  readonly name = 'release';
  private spin = 0;
  constructor(kit: AizenKit) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'az_awaken', (n) => {
      if (n === 'charge') {
        f.aura.flare(1.8, 1);
        f.aura.pillarBurst(2.2);
        g.sfx.play('charge', f.center(), 1.2);
        g.callout('崩玉', 'THE HŌGYOKU AWAKENS', '#c9b6ff');
      }
      if (n === 'burst') this.kit.becomeChrysalis();
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // white silk winding in round him until the cocoon breaks
    if (this.t < 0.9) {
      this.spin += dt * 9;
      const p = f.pos;
      for (let i = 0; i < 3; i++) {
        const a = this.spin + i * 2.09, r = 1.6 - this.t * 1.2, y = 0.2 + ((this.t * 3 + i * 0.33) % 1) * f.def.height;
        g.engine.glow.spawn({ x: p.x + Math.cos(a) * r, y: p.y + y, z: p.z + Math.sin(a) * r, vx: -Math.sin(a) * 4, vy: 0.4, vz: Math.cos(a) * 4, size: 0.1, sizeEnd: 0.03, life: 0.35, r: 0.96, g: 0.94, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
      }
    }
  }
}

// ------------------------------------------------------------------ the kit

export class AizenKit implements Kit {
  form: AizenForm = 'captain';
  flare = false;
  comboIndex = 0;
  private lastEnd = 0;
  private cd = { heavy: 0, kuro: 0, raikoho: 0, dragons: 0, illusion: 0, parry: 0 };
  private hurtT = 0;
  private hidden = false;
  private glassesBroken: Shattered | null = null;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    setHands(f);
    f.onHurt = () => {
      this.hurtT = 0;
    };
    f.parry = (amount, from, o) => this.tryParry(amount, from, o);
    this.applyStats();
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    // the Hōgyoku: wounds close by themselves
    this.hurtT += dt;
    if (this.form === 'chrysalis' && !f.dead && this.hurtT > 1.5 && f.hp < f.maxHp) {
      f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.012 * dt);
      if (Math.random() < dt * 8) {
        const c = f.center();
        g.engine.glow.spawn({ x: c.x + (Math.random() - 0.5) * 0.5, y: c.y + (Math.random() - 0.5) * 0.9, z: c.z + (Math.random() - 0.5) * 0.5, vx: 0, vy: 0.6, vz: 0, size: 0.12, sizeEnd: 0.02, life: 0.6, r: 0.8, g: 0.7, b: 1, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
      }
    }
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 80, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 80);
  }

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof StringAction) {
      cur.queued = true;
      return;
    }
    if (f.busy && !(cur instanceof FingerAction && cur.canCancel(cur))) return;
    if (this.g.time - this.lastEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.form === 'chrysalis' ? CHRYSALIS_CHAIN : AIZEN_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.8;
    this.f.act(new StringAction(this, list[idx], idx), true);
  }

  private special(a: SkillAction, cost: number, cdKey: keyof typeof this.cd, cd: number): void {
    const f = this.f;
    if (this.cd[cdKey] > 0) return;
    if (f.action && !f.action.canCancel(a)) return;
    if (f.hitstun > 0 || f.dashT > 0 || f.dead) return;
    if (!f.spendRei(cost)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    this.cd[cdKey] = cd;
    f.act(a, true);
  }

  /** RMB: the passing stroke. */
  heavy(): void {
    this.special(new PassAction(this, this.target()), 10, 'heavy', 3);
  }

  /** Q: Hadō #90 Kurohitsugi (fully incanted from the Chrysalis). */
  skill1(): void {
    this.special(new KidoAction(this, 'kurohitsugi', this.target()), this.form === 'chrysalis' ? 40 : 30, 'kuro', this.form === 'chrysalis' ? 9 : 7);
  }

  /** E: Hadō #63 Raikōhō / Hadō #99 Goryūtenmetsu (Chrysalis). */
  skill2(): void {
    if (this.form === 'chrysalis') this.special(new KidoAction(this, 'dragons', this.target()), 50, 'dragons', 12);
    else this.special(new KidoAction(this, 'raikoho', this.target()), 16, 'raikoho', 2.5);
  }

  /** R: Kyōka Suigetsu — the illusion. */
  skill3(): void {
    this.special(new IllusionAction(this, this.target()), 25, 'illusion', 9);
  }

  /** G: the reveal (one way). */
  toggle(): void {
    const f = this.f;
    if (this.form !== 'captain' || f.busy) return;
    f.act(new RevealAction(this), true);
  }

  /** F: the Hōgyoku. */
  release(): void {
    const f = this.f;
    if (this.form === 'chrysalis' || f.busy) return;
    if (!f.spendRei(60)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new AwakenAction(this), true);
  }

  /** V: the full weight of his reiatsu — everyone near is pinned under it for a moment. */
  toggleFlare(): void {
    const { f, g } = this;
    this.flare = !this.flare;
    this.applyStats();
    if (!this.flare) return;
    f.aura.flare(1.8, 0.6);
    g.shake(0.25);
    g.sfx.play('flare', f.center());
    g.addRing(f.pos.clone(), 14, VIOLET, 0.6);
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d < 12) {
        o.hitstun = Math.max(o.hitstun, 0.7 * (1 - d / 12) + 0.2);
        o.body.vel.y = Math.min(o.body.vel.y, -4);
        o.hovering = false;
      }
    }
  }

  /** The AI's opener. */
  kudakero(): void {
    if (this.f.busy) return;
    this.f.act(new KudakeroAction(this), true);
  }

  /** The finger block: light, frontal, not while he is busy. */
  private tryParry(amount: number, from: Fighter | null, o: DamageOpts): boolean {
    const { f, g } = this;
    if (!from || o.heavy || o.quiet || this.cd.parry > 0 || this.hidden) return false;
    if (f.action || f.hitstun > 0 || f.dashT > 0 || f.dead) return false;
    if (amount * from.power > 48) return false;
    _v.subVectors(from.pos, f.pos).setY(0);
    if (_v.lengthSq() < 1e-4 || _v.normalize().dot(f.forward(_w)) < 0.35) return false;
    if (Math.random() > (this.form === 'traitor' ? 0.55 : this.form === 'chrysalis' ? 0.3 : 0.4)) return false;
    this.cd.parry = 1.6;
    f.act(new FingerAction(this), true);
    f.yaw = Math.atan2(_v.x, _v.z);
    const p = f.center().addScaledVector(_v, 0.55);
    p.y += 0.25;
    g.sparks(p, _v.clone().negate(), '#F2EEFF', 18);
    g.addRing(p.clone(), 1.6, '#E9E4FF', 0.25);
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.5, sizeEnd: 1.6, life: 0.18, r: 1, g: 0.97, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    g.sfx.play('ting', p, 1);
    g.hitstop(0.1);
    // a blade (not a shot from afar) simply stops on the fingertip; its wielder reels back from it
    if (from.pos.distanceTo(f.pos) < 3.5) {
      from.stopAction();
      from.hitstun = Math.max(from.hitstun, 0.45);
      from.push.addScaledVector(_v, 7);
      from.anim.flinch(-120, 0);
    }
    if (from === g.player || f === g.player) g.shake(0.15);
    return true;
  }

  hide(on: boolean): void {
    const f = this.f;
    this.hidden = on;
    f.visual.object.visible = !on;
    f.aura.group.visible = !on;
    if (f.trail) f.trail.mesh.visible = !on;
  }

  crushGlasses(): void {
    const { f, g } = this;
    const prop = f.visual.props.get('glasses');
    if (!prop) return;
    prop.updateMatrixWorld(true);
    const origin = prop.getWorldPosition(new THREE.Vector3());
    this.glassesBroken ??= shatterModel(aizenProp('glasses'), { pieces: 7, seed: 5, jitter: 0.8 });
    g.addProjectile(new ShardBurst(g, this.glassesBroken.shards, prop.matrixWorld, { origin, dir: f.forward(), speed: 2.2, life: 1.8, dust: '#DDE9F1' }));
    f.visual.detach('glasses');
    g.sfx.play('crack', origin, 0.8);
    for (let i = 0; i < 10; i++)
      g.engine.glow.spawn({ x: origin.x, y: origin.y, z: origin.z, vx: (Math.random() - 0.5) * 3, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 3, size: 0.05, sizeEnd: 0.01, life: 0.4, r: 0.9, g: 0.95, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  }

  becomeTraitor(): void {
    const { f, g } = this;
    if (this.form !== 'captain') return;
    this.form = 'traitor';
    f.setForm({ asset: aizenAsset('traitor'), props: [{ key: 'sword', model: aizenProp('katana'), socket: 'grip.R' }, { key: 'sheath', model: aizenProp('sheath-empty'), socket: 'hip.L' }] }, AURA_AIZEN, BLADE_KYOKA);
    setHands(f);
    f.aura.flare(1.4, 0.8);
    g.callout('藍染惣右介', 'NO ONE STANDS ON TOP OF THE WORLD', '#c9b6ff');
    g.engine.gr.chroma.offset.set(0.003, 0.003);
    this.applyStats();
  }

  becomeChrysalis(): void {
    const { f, g } = this;
    if (this.form === 'chrysalis') return;
    this.form = 'chrysalis';
    f.def = { ...f.def, stance: CHRYSALIS_STANCE, speed: { ...SPEED_CHRYSALIS }, height: 1.9 };
    f.setForm({ asset: aizenAsset('chrysalis'), props: [] }, AURA_HOGYOKU, BLADE_FUSED);
    f.visual.attach('sword', aizenProp('fused'), 'grip.R', undefined, FUSED_ROT);
    setHands(f);
    f.bladeValid = false;
    f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.35);
    this.comboIndex = 0;
    // the cocoon breaks
    f.aura.pillarBurst(2.8);
    f.aura.flare(2.4, 1.2);
    g.sfx.play('bankai', f.center());
    g.shake(0.9);
    g.hitstop(0.08);
    g.slowMo(0.45, 0.3);
    g.engine.gr.chroma.offset.set(0.007, 0.007);
    g.addRing(f.pos.clone(), 22, VIOLET, 0.9);
    g.callout('崩玉 · 融合', 'HŌGYOKU — THE CHRYSALIS', '#c9b6ff');
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d < 14) g.damage(o, 30 * (1 - d / 14), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 24 * (1 - d / 14), launch: 6, heavy: true });
    }
    const c = f.center();
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2;
      const white = i % 3 !== 0;
      g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: Math.cos(a) * (5 + Math.random() * 9), vy: 2 + Math.random() * 9, vz: Math.sin(a) * (5 + Math.random() * 9), size: 0.35, sizeEnd: 0.05, life: 0.9, r: white ? 0.96 : 0.6, g: white ? 0.94 : 0.3, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 1.2 });
      g.engine.dust.spawn({ x: f.pos.x, y: f.pos.y + 0.3, z: f.pos.z, vx: Math.cos(a) * 12, vy: Math.random() * 2, vz: Math.sin(a) * 12, size: 0.8, sizeEnd: 2.6, life: 1.1, r: 0.86, g: 0.84, b: 0.88, alpha: 0.45, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    }
    this.applyStats();
  }

  private applyStats(): void {
    const f = this.f;
    f.power = (this.form === 'chrysalis' ? 1.6 : this.form === 'traitor' ? 1.2 : 1) * (this.flare ? 1.25 : 1);
    f.damageTaken = this.form === 'chrysalis' ? 0.7 : 0.85;
    f.toughness = this.form === 'chrysalis' ? 20 : 8;
    f.aura.target = this.flare ? 0.9 : this.form === 'chrysalis' ? 0.4 : this.form === 'traitor' ? 0.18 : 0.06;
  }

  formName(): string {
    return this.form === 'chrysalis' ? 'Hōgyoku — the Chrysalis' : this.form === 'traitor' ? 'Kyōka Suigetsu' : 'Captain, 5th Division';
  }

  ai(): KitAI {
    return {
      reach: 1.5,
      chain: 3,
      releaseAt: [0.4],
      toggleAt: 0.75,
      toggleOn: () => this.form !== 'captain',
      opener: () => this.kudakero(),
      moves: [
        { name: 'kurohitsugi', use: () => this.skill1(), min: 3, max: 35, weight: 1.8, cd: 7 },
        { name: 'raikoho', use: () => this.skill2(), min: 4, max: 45, weight: 2, cd: 3, when: () => this.form !== 'chrysalis' },
        { name: 'dragons', use: () => this.skill2(), min: 6, max: 70, weight: 1.6, cd: 12, when: () => this.form === 'chrysalis' },
        { name: 'illusion', use: () => this.skill3(), min: 2, max: 18, weight: 1.4, cd: 9 },
        { name: 'pass', use: () => this.heavy(), min: 1.5, max: 9, weight: 1.8, cd: 3.5 },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const fm = this.form;
    const ch = fm === 'chrysalis';
    const list: AbilityInfo[] = [
      { key: 'LMB', name: ch ? 'Fused blade' : 'Kyōka strikes', kanji: '斬' },
      { key: 'RMB', name: 'Passing cut', kanji: '過', cost: 10, cd: this.cd.heavy, cdMax: 3 },
      { key: 'Q', name: 'Kurohitsugi', kanji: '黒棺', cost: ch ? 40 : 30, cd: this.cd.kuro, cdMax: ch ? 9 : 7 },
      ch ? { key: 'E', name: 'Goryūtenmetsu', kanji: '五龍', cost: 50, cd: this.cd.dragons, cdMax: 12 } : { key: 'E', name: 'Raikōhō', kanji: '雷吼', cost: 16, cd: this.cd.raikoho, cdMax: 2.5 },
      { key: 'R', name: 'Kyōka Suigetsu', kanji: '鏡花', cost: 25, cd: this.cd.illusion, cdMax: 9 },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      { key: 'F', name: 'Hōgyoku', kanji: '崩玉', cost: 60, active: ch, tint: '#c9b6ff' },
    ];
    if (fm !== 'chrysalis') list.push({ key: 'G', name: fm === 'captain' ? 'Reveal' : 'Revealed', kanji: '眼鏡', active: fm === 'traitor', tint: '#c9b6ff' });
    return list;
  }
}
