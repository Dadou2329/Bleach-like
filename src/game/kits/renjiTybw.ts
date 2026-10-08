// TYBW Renji (docs/kits/renji.md, Thousand-Year Blood War loadout). Sealed and Shikai as the lieutenant's, in the
// Ōken clothing, plus the catch (R: a blow stopped dead in the open hand, the elbow driven down into a crater) and
// lashes that bat shots aside. F from the Shikai: Bankai — Sōō Zabimaru, the true name. The Ōken tears away; the
// right forearm is a snake skull with a blade in its mouth, the left shoulder carries Hihiō, the baboon king's giant
// arm, which copies his left arm. LMB the arm-blade string (cut, cut, the skull driven up, Hihiō's hammer-fist into
// the ground); RMB Hihiō's jet-boosted punch; Q Orochiō (the blade grown long and serrated) and, while it lasts, the
// whip-snake bite; RMB in Orochiō the red-hot throw on the tail — RMB again reels him to whatever it pinned; E Zazekka,
// the exploding segmented whip; R Hihi Tenshō, the giant hands out of the fur; F Zaga Teppō at arm's length (or
// Hikotsu Taihō out of Hihiō's palm at range); G Zagai Zekkō, the skull whirled overhead for up to twenty seconds and
// hurled as a disc of fire. Hihiō's palm swallows shots from the front while it is idle; sealed in Bankai, a furless
// Hihiō still tears out once for one weak Hikotsu Taihō.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { AIMove, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { RENJI_DEF, RenjiKit } from './renji';
import { renjiProp } from '../../chars/renji';
import { OROCHIO_TIP, SOO_BLADE_BASE, SOO_BLADE_TIP, renjiTybwAsset, renjiTybwProp } from '../../chars/renjiTybw';
import { RENJI_CLIPS } from '../../chars/renjiClips';
import { RENJI_TYBW_CLIPS, SOO_CHAIN, SOO_STANCE } from '../../chars/renjiTybwClips';
import { HihioArm, HihiTensho, SOO_GOLD, ZagaSkull, ZagaiCharge, ZagaiDisc, fireBurst, jetFlame } from '../../vfx/sooZabimaru';
import { BeadLine, TetherBlade } from '../../vfx/shiro';
import { SegmentedWhip } from '../../vfx/whip';
import { CeroBeam } from '../projectiles/cero';
import { PropMesh } from '../characterFactory';
import { SphereShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from '../../vfx/sprites';
import { groundAt } from '../../vfx/iceArts';
import type { AuraStyle } from '../../vfx/aura';

export const AURA_SOO: AuraStyle = { core: '#FFF1B8', body: '#F5C542', rim: '#C9902A' };
type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE_SOO: BladeDef = { prop: 'sword', base: [...SOO_BLADE_BASE], tip: [...SOO_BLADE_TIP], color: SOO_GOLD, core: '#FFF1B8' };
const BLADE_OROCHI: BladeDef = { prop: 'sword', base: [...SOO_BLADE_BASE], tip: [...OROCHIO_TIP], color: '#FF8A2A', core: '#FFE0B0' };
const SPEED_SOO = { run: 11, sprint: 27, jump: 13, dash: 18, dashTime: 0.1 };

/** the blade props' frame (blade down −Y, edge +Z) onto a hilt frame (blade +Z, edge −Y) */
const TO_HILT = new THREE.Matrix4().set(-1, 0, 0, 0, 0, 0, -1, 0, 0, -1, 0, 0, 0, 0, 0, 1);
const TO_HILT_Q = new THREE.Quaternion().setFromRotationMatrix(TO_HILT);

export const RENJI_TYBW_DEF: FighterDef = {
  ...RENJI_DEF,
  id: 'renji-tybw',
  title: 'Lieutenant, 6th Division',
  build: () => ({
    asset: renjiTybwAsset('oken'),
    props: [
      { key: 'sword', model: renjiProp('katana'), socket: 'grip.R' },
      { key: 'sheath', model: renjiProp('sheath-empty'), socket: 'hip.L' },
    ],
  }),
  clips: [...RENJI_CLIPS, ...RENJI_TYBW_CLIPS],
  hp: 1150,
  rei: 150,
};

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
const D2R = Math.PI / 180;

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

const pose = (deg: Record<string, [number, number, number]>): Map<string, THREE.Quaternion> =>
  new Map(Object.entries(deg).map(([k, [x, y, z]]) => [k, new THREE.Quaternion().setFromEuler(new THREE.Euler(x * D2R, y * D2R, z * D2R))]));
/** Hihiō's palm raised before him as an umbrella */
const UMBRELLA = pose({ 'upperarm.L': [-128, 0, 14], 'forearm.L': [-62, 0, 0], 'hand.L': [-20, 0, 70] });
/** the arm thrust out, the palm toward the target (Two Kings' last shot) */
const LEVELLED = pose({ 'upperarm.L': [-84, 0, 6], 'forearm.L': [-6, 0, 0], 'hand.L': [-6, 0, 50] });

// ------------------------------------------------------------------ actions

abstract class TybwAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: RenjiTybwKit) {
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
  override end(f: Fighter): void {
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > this.dur * 0.7;
  }
}

interface SooCut {
  window: [number, number];
  spec: BladeSpec;
  lunge: number;
}
const SOO_CUTS: Record<string, SooCut> = {
  so_cut1: { window: [0.1, 0.24], lunge: 8, spec: { damage: 30, knock: 8, launch: 0, hitstop: 0.05, shake: 0.15, cut: 600 } },
  so_cut2: { window: [0.1, 0.24], lunge: 7, spec: { damage: 30, knock: 8, launch: 4, hitstop: 0.05, shake: 0.15, cut: 600 } },
  so_bash: { window: [0.1, 0.26], lunge: 6, spec: { damage: 38, knock: 9, launch: 12, heavy: true, hitstop: 0.09, shake: 0.35, cut: 700 } },
};

/** LMB: the gauntlet's blade (Orochiō: longer, heavier, the serrations biting deeper) */
class SooCutAction extends TybwAction {
  readonly name: string;
  queued = false;
  private comboAt = 0.3;
  private info: SooCut;
  constructor(kit: RenjiTybwKit, readonly clip: string, readonly index: number) {
    super(kit);
    this.name = clip;
    this.info = SOO_CUTS[clip];
    this.mobility = 0.12;
    this.airGravity = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events?.combo ?? this.dur * 0.6;
    f.bladeHits.clear();
    const oro = this.kit.orochiT > 0;
    f.bladeSpec = oro ? { ...this.info.spec, damage: this.info.spec.damage * 1.35, cut: this.info.spec.cut * 1.5, reach: 0.35, knock: this.info.spec.knock + 3 } : this.info.spec;
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n !== 'step') return;
        const tgt = f.faceTarget;
        const extra = tgt ? Math.min(5, Math.max(0, f.pos.distanceTo(tgt) - 1.8)) : 0;
        f.push.addScaledVector(f.forward(), this.info.lunge + extra * 2.2);
        g.sfx.play(this.info.spec.heavy ? 'swingHeavy' : 'swing', f.center(), 0.8);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    f.bladeActive = t >= this.info.window[0] && t <= this.info.window[1];
    if (f.trail) f.trail.emitting = t >= this.info.window[0] - 0.03 && t <= this.info.window[1] + 0.06;
    if (this.queued && t >= this.comboAt) {
      this.done = true;
      this.kit.sooChain(this.index + 1);
    }
  }
  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash' || next instanceof TybwAction) return this.t >= this.info.window[0] + 0.04;
    return false;
  }
}

/** the string's finisher: Hihiō's hammer-fist into the ground; the street ruptures in a line ahead */
class HammerAction extends TybwAction {
  readonly name = 'so_hammer';
  queued = false;
  private slammed = false;
  constructor(kit: RenjiTybwKit) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'so_hammer', (n) => {
      if (n === 'raise') {
        this.kit.showHihio(0.8, true);
        g.sfx.play('swingHeavy', f.center(), 1);
      }
      if (n === 'slam') this.slam(f, g);
    });
  }
  private slam(f: Fighter, g: Game): void {
    if (this.slammed) return;
    this.slammed = true;
    const h = this.kit.hihio;
    const p = h && h.presence > 0.3 ? h.point('fist') : f.pos.clone().addScaledVector(f.forward(), 2.6);
    const gy = groundAt(g, p.x, p.y + 1, p.z, 8) ?? f.pos.y;
    const at = new THREE.Vector3(p.x, gy, p.z);
    g.groundImpact(at, 2.6, 700, SOO_GOLD, f);
    const fw = f.forward(_v).setY(0).normalize().clone();
    // the swipe ruptures the pavement in a line ahead
    for (let d = 2; d <= 8; d += 2) g.engine.destruction.carve(new SphereShape(at.clone().addScaledVector(fw, d).setY(gy - 0.2), 1.2, 0.7), { mode: 'smash', power: 500, impulse: 9, dust: 0.6 });
    for (const o of g.enemiesOf(f)) {
      const d = Math.hypot(o.pos.x - at.x, o.pos.z - at.z);
      const along = (o.pos.x - at.x) * fw.x + (o.pos.z - at.z) * fw.z;
      const lat = Math.abs((o.pos.x - at.x) * fw.z - (o.pos.z - at.z) * fw.x);
      if (o.dead || !(d < 3.4 || (along > 0 && along < 8.5 && lat < 1.6))) continue;
      g.damage(o, d < 3.4 ? 60 : 36, f, fw.clone(), { knock: 14, launch: 9, heavy: true, hitstop: 0.12, shake: 0.6 });
    }
    g.shake(f === g.player ? 0.7 : 0.3);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.queued && this.t >= 0.6) {
      this.done = true;
      this.kit.sooChain(0);
    }
  }
  override canCancel(next: FighterAction): boolean {
    return (next.name === 'dash' || next instanceof TybwAction) && this.t > 0.5;
  }
}

/** RMB: Hihiō's straight punch, jet-boosted out of the shoulder disk; what it hits goes through buildings */
class PunchAction extends TybwAction {
  readonly name = 'hihio-punch';
  private hits = new Set<number>();
  constructor(kit: RenjiTybwKit) {
    super(kit);
    this.mobility = 0.1;
    this.armor = 0.35;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.showHihio(0.95, true);
    this.playClip(f, 'so_punch', (n) => {
      if (n === 'boost' && this.kit.hihio) {
        this.kit.hihio.boost = 0.32;
        g.sfx.play('flare', f.center(), 0.9);
        f.push.addScaledVector(f.forward(), 7);
      }
      if (n === 'hit') g.sfx.play('hitHeavy', f.center(), 1.1);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const h = this.kit.hihio;
    if (!h || this.t < 0.22 || this.t > 0.42 || h.presence < 0.3) return;
    const p = h.fistPos;
    g.engine.destruction.carve(new SphereShape(p.clone(), 1.5, 0.7), { mode: 'smash', power: 900, impulse: 14, dust: 0.5 });
    for (const o of g.enemiesOf(f)) {
      if (o.dead || this.hits.has(o.id)) continue;
      if (o.center(_v).distanceTo(p) > 1.9 + o.def.radius && o.center(_v).distanceTo(h.prevFist) > 1.9 + o.def.radius) continue;
      this.hits.add(o.id);
      const dir = f.forward(_w).setY(0).normalize().clone();
      g.damage(o, 80, f, dir, { knock: 32, launch: 8, heavy: true, hitstop: 0.14, shake: 0.7 });
      g.sparks(o.center(), dir, SOO_GOLD, 24);
    }
  }
}

/** Q: Orochiō — the blade grows long and serrated out of the jaws (12 s) */
class OrochiAction extends TybwAction {
  readonly name = 'orochio';
  constructor(kit: RenjiTybwKit) {
    super(kit);
    this.mobility = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'so_orochi', (n) => {
      if (n !== 'grow') return;
      this.kit.setOrochi(12);
      g.callout('オロチ王', 'OROCHIŌ', '#ff9a4a');
      g.sfx.play('crack', f.center(), 1);
      f.aura.flare(1.4, 0.5);
    });
  }
}

/**
 * The whip-snake: the tail wound round the forearm, Orochiō lashed out at the end of it (≤ 20 m) — the jaws catch
 * the target, lift it and slam it into the ground; then the blade comes home.
 */
class SnakeAction extends TybwAction {
  readonly name = 'whip-snake';
  private line: BeadLine | null = null;
  private head: PropMesh | null = null;
  private headPos = new THREE.Vector3();
  private caught: Fighter | null = null;
  private out: THREE.Vector3;
  private slammed = false;
  constructor(kit: RenjiTybwKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.3;
    this.out = target.center();
  }
  override start(f: Fighter, g: Game): void {
    this.line = new BeadLine(g, renjiTybwProp('tail-vert'), 0.11, 220);
    this.line.flash(1, 0.55, 0.2, 0.35);
    this.head = new PropMesh(renjiTybwProp('orochio'));
    this.head.visible = false;
    g.engine.gr.scene.add(this.head);
    this.headPos.copy(sock(f, 'grip.R'));
    this.kit.bladeShown(false);
    this.playClip(f, 'so_snake', (n) => {
      if (n === 'lash') g.sfx.play('swingHeavy', f.center(), 1);
      if (n === 'slam') this.slam(f, g);
    });
  }
  private slam(f: Fighter, g: Game): void {
    if (this.slammed) return;
    this.slammed = true;
    const o = this.caught;
    if (!o || o.dead) return;
    const gy = groundAt(g, o.pos.x, o.pos.y + 1, o.pos.z, 12) ?? o.pos.y;
    o.body.pos.y = gy + 0.05;
    o.body.vel.set(0, -10, 0);
    g.damage(o, 60, f, new THREE.Vector3(0, -1, 0), { knock: 4, launch: 0, heavy: true, hitstop: 0.12, shake: 0.6 });
    g.groundImpact(new THREE.Vector3(o.pos.x, gy, o.pos.z), 2.2, 600, '#FF8A2A', f);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    const hand = sock(f, 'grip.R', _w);
    const tgt = this.target;
    if (!tgt.dead && t < 0.14) this.out.copy(tgt.center());
    // the head: out to the target by 0.14, held (lifted 3 m by 0.42), slammed down by 0.64, home by 0.9
    const o = this.caught;
    if (t < 0.14) this.headPos.lerpVectors(hand, this.out, t / 0.14);
    else if (t < 0.64) {
      if (!o && !this.caught && t >= 0.14 && !tgt.dead && tgt.center(_v).distanceTo(this.out) < 2.2) {
        this.caught = tgt;
        g.damage(tgt, 40, f, _v.subVectors(tgt.pos, f.pos).setY(0).normalize().clone(), { knock: 0, hitstop: 0.1, shake: 0.35, heavy: true });
        g.sparks(tgt.center(), UP, '#FF8A2A', 14);
      }
      const lift = THREE.MathUtils.smoothstep(t, 0.16, 0.42) * 3 * (t < 0.42 ? 1 : 1 - THREE.MathUtils.smoothstep(t, 0.42, 0.64));
      this.headPos.copy(this.out).setY(this.out.y + lift);
    } else this.headPos.lerpVectors(this.out, hand, THREE.MathUtils.smoothstep(t, 0.7, 0.92));
    const v = this.caught;
    if (v && !v.dead && t < 0.64) {
      v.body.pos.copy(this.headPos).setY(this.headPos.y - v.def.height * 0.5);
      v.body.vel.set(0, 0, 0);
      v.push.set(0, 0, 0);
      v.hitstun = Math.max(v.hitstun, 0.3);
    }
    this.place(f);
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.bladeShown(true);
    this.line?.dispose();
    this.head?.removeFromParent();
    this.head?.material.dispose();
  }
  /** the tail and the head laid out along the lash */
  private place(f: Fighter): void {
    if (!this.line || !this.head) return;
    const hand = sock(f, 'grip.R', _w);
    const d = _v.subVectors(this.headPos, hand);
    const home = this.t > 0.9;
    this.head.visible = !home;
    if (home) {
      this.line.hide();
      return;
    }
    if (d.lengthSq() < 1e-6) d.copy(f.forward(_v));
    d.normalize();
    this.head.position.copy(this.headPos);
    this.head.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), d);
    this.line.update(hand, this.headPos, Math.min(0.8, hand.distanceTo(this.headPos) * 0.04), this.t);
  }
}

/** RMB in Orochiō: the blade heated red-hot and thrown on its tail — through walls, blowing up what it passes */
class ThrowAction extends TybwAction {
  readonly name = 'orochio-throw';
  constructor(kit: RenjiTybwKit) {
    super(kit);
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'so_throw', (n) => {
      if (n !== 'throw') return;
      this.kit.throwHot();
    });
  }
  override canCancel(next: FighterAction): boolean {
    return (next instanceof ReelAction && this.t > 0.32) || super.canCancel(next);
  }
}

/** RMB again: the yank — the tail hauls him to whatever the blade pinned (or brings it home) */
class ReelAction extends TybwAction {
  readonly name = 'reel';
  constructor(kit: RenjiTybwKit) {
    super(kit);
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'so_reel', (n) => {
      if (n !== 'reel') return;
      this.kit.thrown?.reel();
      g.sfx.play('swingHeavy', f.center(), 1);
    });
  }
}

/** E: Zazekka — the blade comes apart into a whip of segments; the tip explodes on what it reaches */
class ZazekkaAction extends TybwAction {
  readonly name = 'zazekka';
  private whip: SegmentedWhip | null = null;
  private frame = new THREE.Object3D();
  private blown = false;
  private yaw0 = 0;
  private spec: BladeSpec = { damage: 46, knock: 9, launch: 3, hitstop: 0.06, shake: 0.25, cut: 700 };
  constructor(kit: RenjiTybwKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0.1;
    this.armor = 0.2;
    this.frame.quaternion.copy(TO_HILT_Q);
  }
  override start(f: Fighter, g: Game): void {
    const sword = f.visual.props.get('sword');
    sword?.add(this.frame);
    this.whip = new SegmentedWhip(g, f, () => (this.frame.parent ? this.frame : null), { thread: SOO_GOLD, trail: SOO_GOLD, core: '#FFF1B8' });
    g.addProjectile(this.whip);
    f.bladeHits.clear();
    const a = this.target ? this.target.center() : aim(f, g);
    this.yaw0 = Math.atan2(a.x - f.pos.x, a.z - f.pos.z);
    this.playClip(f, 'so_zazekka', (n) => {
      if (n === 'lash') {
        this.kit.bladeShown(false);
        g.callout('蛇舌谺', 'ZAZEKKA', '#ff9a4a');
        g.sfx.play('swingHeavy', f.center(), 1.1);
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const w = this.whip;
    if (!w) return;
    const t = this.t;
    const hand = sock(f, 'grip.R', _w);
    // as far as the target and a little past it (the tip blows up on it), else twenty metres
    const len = this.target && !this.target.dead ? THREE.MathUtils.clamp(this.target.center(_v).distanceTo(hand) + 1.2, 8, 22) : 20;
    // the far end sweeps across the aim from his right to his left
    const k = THREE.MathUtils.clamp((t - 0.16) / 0.42, 0, 1);
    const yaw = this.yaw0 - 0.55 + k * 1.1;
    const tc = this.target && !this.target.dead ? this.target.center() : null;
    const pitch = tc ? Math.atan2(tc.y - hand.y, Math.max(1, Math.hypot(tc.x - hand.x, tc.z - hand.z))) : 0;
    w.target.set(hand.x + Math.sin(yaw) * Math.cos(pitch) * len, hand.y + Math.sin(pitch) * len, hand.z + Math.cos(yaw) * Math.cos(pitch) * len);
    w.wave = 0.18;
    w.glow = 0.8;
    if (t < 0.16) w.ext = 0;
    else if (t < 0.62) w.ext = Math.min(1, (t - 0.16) / 0.12);
    else w.ext = Math.max(0, 1 - (t - 0.62) / 0.2);
    w.sweep = w.ext > 0.3 && t < 0.62 ? this.spec : null;
    // big shots in its path are batted away
    if (w.ext > 0.3) for (const i of [2, 4, 6]) g.rejectNear(w.pts[i], 1.4, f, false);
    // the tip blows up on the first thing it reaches
    if (!this.blown && w.ext > 0.6 && t < 0.62) {
      const tip = w.tip;
      let hit = g.engine.world.isSolidAtPos(tip.x, tip.y, tip.z);
      for (const o of g.enemiesOf(f)) if (!o.dead && o.center(_v).distanceTo(tip) < 1.4 + o.def.radius) hit = true;
      if (hit) {
        this.blown = true;
        const p = tip.clone();
        g.engine.destruction.carve(new SphereShape(p, 2.4, 0.6), { mode: 'explode', power: 800, sparks: [1, 0.55, 0.2], dust: 0.6 });
        for (const o of g.enemiesOf(f)) {
          const d = o.center(_v).distanceTo(p);
          if (o.dead || d > 3) continue;
          g.damage(o, 50 * (1 - d / 4.5), f, _v.subVectors(o.pos, p).setY(0).normalize().clone(), { knock: 14, launch: 6, heavy: true, energy: true, hitstop: 0.1, shake: 0.5 });
        }
        fireBurst(g, p, 30, 6, 4);
        g.sfx.play('explode', p, 1.1);
      }
    }
  }
  override end(f: Fighter): void {
    super.end(f);
    if (this.whip) {
      this.whip.sweep = null;
      this.whip.done = true;
    }
    this.frame.removeFromParent();
    this.kit.bladeShown(true);
  }
}

/** R: Hihi Tenshō — the pinch sign; fur clumps round the target and the giant hands out of them */
class TenshoAction extends TybwAction {
  readonly name = 'hihi-tensho';
  constructor(kit: RenjiTybwKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.showHihio(1.1, true);
    this.playClip(f, 'so_tensho', (n) => {
      if (n !== 'sign' || this.target.dead) return;
      g.callout('狒皮転生', 'HIHI TENSHŌ', '#9CC3A3');
      const h = new HihiTensho(g, f, this.target);
      this.kit.tensho = h;
      g.addProjectile(h);
    });
  }
}

/** F at arm's length: Zaga Teppō — the stab, the twist, the burning serpent skull */
class TeppoAction extends TybwAction {
  readonly name = 'zaga-teppo';
  private victim: Fighter | null = null;
  constructor(kit: RenjiTybwKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'so_impale', (n) => {
      const o = this.target;
      if (n === 'stab') {
        g.sfx.play('swingHeavy', f.center(), 1);
        if (!o.dead && o.pos.distanceTo(f.pos) < 3.8) {
          this.victim = o;
          g.damage(o, 40, f, f.forward(_v).setY(0).normalize().clone(), { knock: 0, hitstop: 0.14, shake: 0.4, heavy: true, unblockable: true });
          g.callout('双王蛇尾丸・蛇牙鉄炮', 'SŌŌ ZABIMARU — ZAGA TEPPŌ', '#ff8a4a');
        }
      }
      const v = this.victim;
      if (!v || v.dead) return;
      if (n === 'twist') {
        g.damage(v, 20, f, f.forward(_v).setY(0).normalize().clone(), { knock: 0, hitstop: 0.08, quiet: true });
        g.sfx.play('crack', v.center(), 1);
        g.sparks(v.center(), UP, '#FF8A2A', 16);
      }
      if (n === 'bite') {
        const dir = f.forward(_v).setY(0).normalize().clone();
        g.addProjectile(new ZagaSkull(g, f, v, dir, () => {
          g.damage(v, 160, f, dir, { knock: 20, launch: 6, heavy: true, energy: true, hitstop: 0.18, shake: 0.9, unblockable: true });
          g.engine.destruction.carve(new SphereShape(v.center(), 2.8, 0.6), { mode: 'explode', power: 1200, sparks: [1, 0.55, 0.2], dust: 0.7 });
          // a foe already near the end is left an ash husk
          if (!v.dead && !v.def.boss && v.hp <= v.maxHp * 0.25) {
            g.damage(v, v.hp * 4 + 100, f, dir, { knock: 0, quiet: true, unblockable: true });
            const c = v.center();
            for (let i = 0; i < 40; i++) g.engine.dust.spawn({ x: c.x + (Math.random() - 0.5), y: c.y + (Math.random() - 0.5) * 1.6, z: c.z + (Math.random() - 0.5), vx: (Math.random() - 0.5) * 2, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 2, size: 0.3, sizeEnd: 0.9, life: 1.6, r: 0.36, g: 0.34, b: 0.32, alpha: 0.8, alphaEnd: 0, tex: TEX_PUFF, gravity: -2, drag: 1 });
            g.callout('', 'ASH', '#a0a0a0');
          }
        }));
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const v = this.victim;
    if (!v || v.dead || this.t > 1.05) return;
    // held on the blade at arm's length
    const fw = f.forward(_v).setY(0).normalize();
    v.body.pos.x = f.pos.x + fw.x * 1.75;
    v.body.pos.z = f.pos.z + fw.z * 1.75;
    v.body.vel.set(0, 0, 0);
    v.push.set(0, 0, 0);
    v.hitstun = Math.max(v.hitstun, 0.3);
  }
}

/** F at range: Hikotsu Taihō out of Hihiō's open palm */
class TaihoAction extends TybwAction {
  readonly name = 'hikotsu-taiho';
  constructor(kit: RenjiTybwKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.35;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.showHihio(1.4, false);
    this.playClip(f, 'so_taiho', (n) => {
      const h = this.kit.hihio;
      if (n !== 'charge' || !h) return;
      const o = this.target;
      g.addProjectile(new CeroBeam(g, f, h.socket('palm'), () => (o && !o.dead ? o.center() : aim(f, g)), { charge: 0.45, fire: 0.7, radius: 0.8, damage: 110, power: 900, core: '#FFE0B0', body: '#FF8A1F', rim: '#B8460F', range: 120, track: 0.9, gain: 1.6 }));
      g.callout('狒骨大砲', 'HIKOTSU TAIHŌ', '#ff9a4a');
    });
  }
}

/** G: Zagai Zekkō — the channel: the skull whirled overhead, swelling; he can walk; G again (or twenty seconds) hurls it */
class ZagaiAction extends TybwAction {
  readonly name = 'zagai-zekko';
  private hp0 = 0;
  hurled = false;
  constructor(kit: RenjiTybwKit) {
    super(kit);
    this.mobility = 0.5;
    this.armor = 0.5;
    this.dur = 999;
  }
  override start(f: Fighter, g: Game): void {
    this.hp0 = f.hp;
    f.anim.play('so_whirl', { fadeIn: 0.2 });
    this.kit.showHihio(999, true);
    const h = this.kit.hihio!;
    const z = new ZagaiCharge(g, f, () => h.point('fist'));
    this.kit.zagai = z;
    g.addProjectile(z);
    g.callout('双王蛇尾丸・蛇骸絶吼', 'SŌŌ ZABIMARU — ZAGAI ZEKKŌ', '#ffb04a');
    g.sfx.play('charge', f.center(), 1.2);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const z = this.kit.zagai;
    if (!z) {
      this.done = true;
      return;
    }
    f.aura.target = 0.3 + Math.min(0.5, z.charge / 40);
    // broken by a heavy beating (the canon weakness: the long charge)
    if (this.hp0 - f.hp > 180) {
      this.done = true;
      return;
    }
    if (z.charge >= ZagaiCharge.FULL) this.kit.hurl();
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.restoreAura();
    if (!this.hurled) {
      this.kit.zagai?.collapse();
      this.kit.zagai = null;
      this.kit.setHihio(0.3, true);
      f.anim.stopAll(0.2);
    }
  }
  override canCancel(next: FighterAction): boolean {
    return next instanceof HurlAction;
  }
}

/** G again: the hurl — the disc of fire thrown at the target */
class HurlAction extends TybwAction {
  readonly name = 'zagai-hurl';
  constructor(kit: RenjiTybwKit, private charge: ZagaiCharge) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.setHihio(1.0, true);
    this.playClip(f, 'so_hurl', (n) => {
      if (n !== 'hurl') return;
      const r = this.charge.release();
      this.kit.zagai = null;
      const t = this.kit.target();
      const to = t && !t.dead ? t.center() : aim(f, g);
      const secs = Math.min(ZagaiCharge.FULL, r.charge);
      const blast = Math.min(18, 6 + 0.6 * secs);
      const dmg = 120 + 18 * secs;
      g.addProjectile(new ZagaiDisc(g, f, r.center, to, r.radius + 2, blast, (at, R) => {
        for (const o of g.enemiesOf(f)) {
          const d = o.center(_v).distanceTo(at);
          if (o.dead || d > R) continue;
          g.damage(o, dmg * (1 - 0.5 * (d / R)), f, _w.subVectors(o.pos, at).setY(0).normalize().clone(), { knock: 30, launch: 14, heavy: true, energy: true, hitstop: 0.16, shake: 1 });
        }
      }));
      f.aura.flare(2, 0.8);
    });
  }
}

/** R (sealed): the catch — the open left hand stops the next blow dead */
class CatchAction extends TybwAction {
  readonly name = 'catch';
  constructor(kit: RenjiTybwKit) {
    super(kit);
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'so_catch', (n) => {
      if (n === 'open') this.kit.catching = true;
      if (n === 'close') this.kit.catching = false;
    });
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.catching = false;
  }
}

/** the counter: the elbow driven down into whoever he caught; the street craters under them */
class ElbowAction extends TybwAction {
  readonly name = 'elbow';
  constructor(kit: RenjiTybwKit, readonly victim: Fighter) {
    super(kit);
    this.mobility = 0;
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'so_elbow', (n) => {
      if (n !== 'slam') return;
      const v = this.victim;
      const at = v.dead ? f.pos.clone().addScaledVector(f.forward(), 1.4) : v.pos.clone();
      const gy = groundAt(g, at.x, at.y + 1, at.z, 6) ?? at.y;
      if (!v.dead) g.damage(v, 70, f, new THREE.Vector3(0, -1, 0), { knock: 2, launch: 0, heavy: true, hitstop: 0.16, shake: 0.7, unblockable: true });
      g.groundImpact(new THREE.Vector3(at.x, gy, at.z), 2.4, 650, '#ff8a8a', f);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const v = this.victim;
    if (v.dead || this.t > 0.32) return;
    // held where he caught them until the elbow lands
    const fw = f.forward(_v).setY(0).normalize();
    v.body.pos.x = f.pos.x + fw.x * 1.3;
    v.body.pos.z = f.pos.z + fw.z * 1.3;
    v.body.vel.set(0, 0, 0);
    v.hitstun = Math.max(v.hitstun, 0.4);
  }
}

/** F (Shikai → Bankai): the true name — gold reiatsu, the Ōken torn away, Sōō Zabimaru */
class SooReleaseAction extends TybwAction {
  readonly name = 'release';
  private storm = 0;
  constructor(kit: RenjiTybwKit) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'so_bankai', (n) => {
      if (n === 'charge') {
        f.aura.flare(1.8, 1.2);
        g.sfx.play('charge', f.center(), 1.2);
      }
      if (n === 'burst') this.kit.becomeBankai();
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t < 0.1 || this.t > 1.2) return;
    this.storm += dt;
    if (this.storm < 0.03) return;
    this.storm = 0;
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 6;
      g.engine.dust.spawn({ x: f.pos.x + Math.cos(a) * r, y: f.pos.y + 0.3 + Math.random() * 3, z: f.pos.z + Math.sin(a) * r, vx: -Math.sin(a) * 10, vy: 2 + Math.random() * 3, vz: Math.cos(a) * 10, size: 1, sizeEnd: 3, life: 1.1, r: 0.72, g: 0.66, b: 0.5, alpha: 0.45, alphaEnd: 0, tex: TEX_PUFF, drag: 1 });
    }
    const c = f.center();
    g.engine.glow.spawn({ x: c.x + (Math.random() - 0.5) * 1.2, y: f.pos.y + Math.random() * 0.5, z: c.z + (Math.random() - 0.5) * 1.2, vx: 0, vy: 10 + Math.random() * 8, vz: 0, size: 0.3, sizeEnd: 0.05, life: 0.6, r: 1, g: 0.8, b: 0.3, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 4 });
  }
}

// ------------------------------------------------------------------ the kit

export class RenjiTybwKit extends RenjiKit {
  /** Hihiō (from the Bankai on) */
  hihio: HihioArm | null = null;
  /** seconds left of Orochiō */
  orochiT = 0;
  /** the red-hot blade out on its tail */
  thrown: TetherBlade | null = null;
  tensho: HihiTensho | null = null;
  zagai: ZagaiCharge | null = null;
  /** the catch's open hand */
  catching = false;
  /** Hihiō's fur as an umbrella (1 whole → 0 shredded), and how long it stays broken */
  umbrella = 1;
  umbrellaBroken = 0;
  private hihioT = 0;
  private twoKingsUsed = false;
  private ghost: HihioArm | null = null;
  private ghostT = 0;
  private sooCombo = 0;
  private sooLast = -10;
  private wasPulling = false;
  readonly cd2 = { punch: 0, orochi: 0, snake: 0, throw: 0, reel: 0, zazekka: 0, tensho: 0, teppo: 0, taiho: 0, zagai: 0, catch: 0 };

  constructor(f: Fighter, g: Game) {
    super(f, g);
    f.parry = (amount, from, o) => this.parryHook(amount, from, o);
  }

  get soo(): boolean {
    return this.form === 'bankai';
  }

  override update(dt: number): void {
    const { f, g } = this;
    super.update(dt);
    for (const k of Object.keys(this.cd2) as (keyof typeof this.cd2)[]) this.cd2[k] = Math.max(0, this.cd2[k] - dt);
    // the Shikai, after the palace: its lashes swat shots out of the air
    const w = this.whip;
    if (this.form === 'shikai' && w && w.ext > 0.25) for (let i = 1; i < w.pts.length; i++) g.rejectNear(w.pts[i], 2, f, false);
    if (!this.soo) return;
    // Hihiō comes out for its moves and goes back into the fur
    this.hihioT = Math.max(0, this.hihioT - dt);
    if (this.hihio) {
      const sealed = f.sealT > 0;
      this.hihio.want = this.hihioT > 0 && !sealed ? 1 : 0;
      if (this.hihioT <= 0) this.hihio.pose = null;
    }
    this.umbrellaBroken = Math.max(0, this.umbrellaBroken - dt);
    if (this.umbrellaBroken <= 0) this.umbrella = Math.min(1, this.umbrella + dt * 0.08);
    if (this.orochiT > 0) {
      this.orochiT -= dt;
      if (this.orochiT <= 0 && !this.thrown) this.setOrochi(0);
    }
    if (this.orochiT > 0 && Math.random() < 0.15) {
      const tip = f.blade.tip;
      g.engine.glow.spawn({ x: tip.x, y: tip.y, z: tip.z, vx: 0, vy: 0.6, vz: 0, size: 0.12, sizeEnd: 0.02, life: 0.4, r: 1, g: 0.6, b: 0.25, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
    }
    // the red-hot blade out on its tail: when it is home the blade is back in the jaws; a haul ends in the skull-bash
    const th = this.thrown;
    if (th) {
      if (th.mode === 'drag') this.wasPulling = true;
      if (th.done) {
        this.thrown = null;
        this.bladeShown(true);
        if (this.orochiT <= 0) this.setOrochi(0);
        else this.setBladeProp('orochio');
        if (this.wasPulling && th.caught && !f.dead) {
          this.wasPulling = false;
          f.stopAction();
          this.sooChain(2);
        }
        this.wasPulling = false;
      }
    }
    if (this.tensho?.done) this.tensho = null;
    // Two Kings: sealed in Bankai, a furless Hihiō tears out of him once for one weak Hikotsu Taihō
    if (f.sealT > 0.5 && !this.twoKingsUsed && !f.dead) this.twoKings();
    if (this.ghost) {
      this.ghostT -= dt;
      if (this.ghostT <= 0) {
        this.ghost.want = 0;
        if (this.ghostT < -0.6) {
          this.ghost.done = true;
          this.ghost = null;
        }
      }
    }
  }

  /** bring Hihiō out for `dur` seconds (fist or open hand) */
  showHihio(dur: number, fist: boolean): boolean {
    if (!this.hihio || this.f.sealT > 0) return false;
    this.hihioT = Math.max(this.hihioT, dur);
    this.hihio.fist = fist;
    this.hihio.pose = null;
    return true;
  }

  /** the aura back to the form's level (after a channel raised it) */
  restoreAura(): void {
    this.applyStats();
  }

  /** Hihiō out for exactly `secs` from now (ends a long hold) */
  setHihio(secs: number, fist: boolean): void {
    if (!this.hihio) return;
    this.hihioT = secs;
    this.hihio.fist = fist;
  }

  /** the gauntlet's blade shown or hidden (while it is out on the tail or apart as Zazekka) */
  bladeShown(on: boolean): void {
    const s = this.f.visual.props.get('sword');
    if (s) s.visible = on;
  }

  private setBladeProp(kind: 'soo-blade' | 'orochio' | 'orochio-hot'): void {
    const f = this.f;
    const vis = f.visual.props.get('sword')?.visible ?? true;
    f.visual.attach('sword', renjiTybwProp(kind), 'grip.R');
    const s = f.visual.props.get('sword');
    if (s) s.visible = vis;
    f.bladeValid = false;
  }

  /** Orochiō on for `secs` (0: back to the plain blade) */
  setOrochi(secs: number): void {
    const f = this.f;
    this.orochiT = secs;
    const blade = secs > 0 ? BLADE_OROCHI : BLADE_SOO;
    f.def = { ...f.def, blade };
    this.setBladeProp(secs > 0 ? 'orochio' : 'soo-blade');
    f.trail?.setColor(blade.color, blade.core);
  }

  /** the red-hot Orochiō thrown on its tail */
  throwHot(): void {
    const { f, g } = this;
    if (this.thrown) return;
    const t = this.target();
    const to = t && !t.dead ? t.center() : aim(f, g);
    this.setBladeProp('orochio-hot');
    this.bladeShown(false);
    const blade = new TetherBlade(g, f, renjiTybwProp('orochio-hot'), () => sock(f, 'grip.R'), {
      kind: 'beads', bead: renjiTybwProp('tail-vert'), beadGap: 0.11, color: '#E4DAC2', length: 1.95, butt: 0, cutR: 0.6, glow: '#FF8A2A', frame: TO_HILT,
    });
    blade.onHit = (o, impaled) => {
      if (!impaled) return;
      const c = o.center();
      g.engine.destruction.carve(new SphereShape(c, 2.4, 0.5), { mode: 'explode', power: 900, sparks: [1, 0.55, 0.2], dust: 0.5 });
      g.damage(o, 40, f, _v.subVectors(o.pos, f.pos).setY(0).normalize().clone(), { knock: 0, energy: true, hitstop: 0.08 });
      fireBurst(g, c, 24, 5, 3);
      g.sfx.play('explode', c, 1);
    };
    blade.throwAt(to, { speed: 45, range: 40, spin: false, impale: true, pin: 2.5, pullOwner: true, bore: { power: 900, blast: 2.4 }, hit: { damage: 95, knock: 0, cut: 900, heavy: true, hitstop: 0.12 } });
    (blade.tether as BeadLine).flash?.(1, 0.45, 0.15, 0.6);
    this.thrown = blade;
    g.addProjectile(blade);
    g.callout('', 'OROCHIŌ — RED-HOT', '#ff7a2a');
    g.sfx.play('swingHeavy', f.center(), 1.2);
  }

  /** G again (or twenty seconds): the disc hurled */
  hurl(): void {
    const z = this.zagai;
    if (!z) return;
    const a = this.f.action;
    if (a instanceof ZagaiAction) a.hurled = true;
    this.f.act(new HurlAction(this, z), true);
  }

  sooChain(i: number): void {
    const idx = i % SOO_CHAIN.length;
    this.sooCombo = idx + 1;
    this.sooLast = this.g.time + 0.9;
    const clip = SOO_CHAIN[idx];
    this.f.act(clip === 'so_hammer' ? new HammerAction(this) : new SooCutAction(this, clip, idx), true);
  }

  private special2(a: FighterAction, cost: number, key: keyof typeof this.cd2, cd: number): boolean {
    const f = this.f;
    if (this.cd2[key] > 0 || f.dead) return false;
    if (f.action && !f.action.canCancel(a)) return false;
    if (f.hitstun > 0 || f.dashT > 0) return false;
    if (cost > 0 && !f.spendRei(cost)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return false;
    }
    this.cd2[key] = cd;
    f.act(a, true);
    return true;
  }

  /** Hihiō's moves need Hihiō: not while sealed */
  private hihioOk(): boolean {
    if (this.f.sealT > 0) {
      if (this.f === this.g.player) this.g.hud?.showBanner('Hihiō does not answer');
      return false;
    }
    return true;
  }

  // ------------------------------------------------------------------ inputs

  override attack(): void {
    if (!this.soo) return super.attack();
    const f = this.f;
    const cur = f.action;
    if (cur instanceof SooCutAction || cur instanceof HammerAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.sooLast > 0.8) this.sooCombo = 0;
    this.sooChain(this.sooCombo);
  }

  override heavy(): void {
    if (!this.soo) return super.heavy();
    if (this.thrown) {
      if (this.thrown.mode === 'pinned' || this.thrown.mode === 'throw') this.special2(new ReelAction(this), 0, 'reel', 0.3);
      return;
    }
    if (this.orochiT > 0) {
      this.special2(new ThrowAction(this), 16, 'throw', 3);
      return;
    }
    if (!this.hihioOk()) return;
    this.special2(new PunchAction(this), 14, 'punch', 2.4);
  }

  override skill1(): void {
    if (!this.soo) return super.skill1();
    if (this.orochiT > 0) {
      const t = this.near(20);
      if (!t || this.thrown) return;
      this.special2(new SnakeAction(this, t), 14, 'snake', 3);
      return;
    }
    this.special2(new OrochiAction(this), 16, 'orochi', 14);
  }

  override skill2(): void {
    if (!this.soo) return super.skill2();
    if (this.thrown) return;
    this.special2(new ZazekkaAction(this, this.target()), 18, 'zazekka', 4.5);
  }

  override skill3(): void {
    if (this.form === 'sealed') {
      this.special2(new CatchAction(this), 4, 'catch', 2.2);
      return;
    }
    if (!this.soo) return super.skill3();
    const t = this.near(30);
    if (!t || !this.hihioOk()) return;
    this.special2(new TenshoAction(this, t), 26, 'tensho', 12);
  }

  override release(): void {
    const f = this.f;
    if (this.form === 'shikai') {
      if (f.busy) return;
      if (!f.spendRei(50)) {
        if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
        return;
      }
      f.act(new SooReleaseAction(this), true);
      return;
    }
    if (!this.soo) return super.release();
    // F: Zaga Teppō at arm's length, Hikotsu Taihō beyond it
    const t = this.target();
    if (t && !t.dead && t.pos.distanceTo(f.pos) < 3.4 && !this.thrown) {
      const fw = f.forward(_v);
      const to = _w.subVectors(t.pos, f.pos).setY(0).normalize();
      if (fw.x * to.x + fw.z * to.z > 0.3) {
        this.special2(new TeppoAction(this, t), 30, 'teppo', 10);
        return;
      }
    }
    if (!this.hihioOk()) return;
    this.special2(new TaihoAction(this, t), 32, 'taiho', 8);
  }

  override toggle(): void {
    if (!this.soo) return super.toggle();
    const z = this.zagai;
    if (z) {
      if (z.charge >= 4) this.hurl();
      return;
    }
    if (this.thrown || !this.hihioOk()) return;
    this.special2(new ZagaiAction(this), 40, 'zagai', 30);
  }

  // ------------------------------------------------------------------ forms

  override becomeBankai(): void {
    const { f, g } = this;
    if (this.form !== 'shikai') return;
    this.form = 'bankai';
    if (this.whip) this.whip.done = true;
    this.whip = null;
    // the Ōken clothing torn away: shreds of the white cape and the tiger jacket
    const c = f.center();
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2;
      const white = i % 2 === 0;
      g.engine.dust.spawn({ x: c.x, y: c.y + (Math.random() - 0.3), z: c.z, vx: Math.cos(a) * (4 + Math.random() * 6), vy: 1 + Math.random() * 5, vz: Math.sin(a) * (4 + Math.random() * 6), size: 0.18, sizeEnd: 0.12, life: 1.4, r: white ? 0.95 : 0.85, g: white ? 0.95 : 0.59, b: white ? 0.93 : 0.16, alpha: 1, alphaEnd: 0, tex: TEX_PUFF, gravity: -6, drag: 1.5 });
    }
    f.def = { ...f.def, stance: SOO_STANCE, speed: { ...SPEED_SOO }, blade: BLADE_SOO };
    f.setForm({ asset: renjiTybwAsset('soo'), props: [{ key: 'sword', model: renjiTybwProp('soo-blade'), socket: 'grip.R' }] }, AURA_SOO, BLADE_SOO);
    f.bladeValid = false;
    this.setHands();
    this.hihio = new HihioArm(g, f);
    g.addProjectile(this.hihio);
    this.showHihio(1.6, true);
    f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.2);
    f.aura.pillarBurst(2.6);
    f.aura.flare(2.2, 1.2);
    g.sfx.play('bankai', f.center());
    g.shake(0.8);
    g.hitstop(0.06);
    g.slowMo(0.4, 0.35);
    g.engine.gr.chroma.offset.set(0.005, 0.005);
    g.addRing(f.pos.clone(), 22, SOO_GOLD, 0.8);
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d < 10) g.damage(o, 20 * (1 - d / 10), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 18 * (1 - d / 10), launch: 5, heavy: true });
    }
    g.callout('卍解「双王蛇尾丸」', 'BANKAI — SŌŌ ZABIMARU', '#f5c542');
    this.applyStats();
  }

  /** sealed in Bankai: the furless king tears out of him for one weak shot */
  private twoKings(): void {
    const { f, g } = this;
    this.twoKingsUsed = true;
    const ghost = new HihioArm(g, f, true);
    ghost.pose = LEVELLED;
    ghost.want = 1;
    ghost.fist = false;
    this.ghost = ghost;
    this.ghostT = 1.6;
    g.addProjectile(ghost);
    const t = this.target();
    g.addProjectile(new CeroBeam(g, f, ghost.socket('palm'), () => (t && !t.dead ? t.center() : aim(f, g)), { charge: 0.5, fire: 0.5, radius: 0.5, damage: 60, power: 500, core: '#FFE0B0', body: '#FF8A1F', rim: '#8E3A0A', range: 90, track: 0.6, gain: 1.4 }));
    g.callout('双王', 'TWO KINGS — HIKOTSU TAIHŌ', '#ff9a4a');
  }

  private parryHook(amount: number, from: Fighter | null, o: { energy?: boolean; quiet?: boolean }): boolean {
    const { f, g } = this;
    // the catch: a blow stopped dead in the open hand, then the elbow
    if (this.catching && from && !from.dead && !o.energy && from.pos.distanceTo(f.pos) < 3.2) {
      this.catching = false;
      from.hitstun = Math.max(from.hitstun, 0.9);
      from.push.set(0, 0, 0);
      from.stopAction();
      g.sfx.play('impact', f.center(), 1);
      g.callout('', 'CAUGHT', '#ff8a8a');
      f.act(new ElbowAction(this, from), true);
      return true;
    }
    // Hihiō's palm as an umbrella: shots from the front are swallowed while the arm is idle
    if (this.soo && o.energy && !o.quiet && from && this.hihio && f.sealT <= 0 && this.umbrellaBroken <= 0 && this.hihioT <= 0 && !f.busy) {
      const to = _v.subVectors(from.pos, f.pos).setY(0).normalize();
      const fw = f.forward(_w).setY(0).normalize();
      if (to.dot(fw) < 0.2) return false;
      this.umbrella -= amount / 350;
      this.hihioT = 0.6;
      this.hihio.pose = UMBRELLA;
      this.hihio.fist = false;
      g.sparks(f.center().add(new THREE.Vector3(0, 1.4, 0)), UP, '#9CC3A3', 12);
      if (this.umbrella <= 0) {
        this.umbrella = 0;
        this.umbrellaBroken = 8;
        const c = f.center().add(new THREE.Vector3(0, 1.6, 0));
        for (let i = 0; i < 30; i++) g.engine.dust.spawn({ x: c.x, y: c.y, z: c.z, vx: (Math.random() - 0.5) * 8, vy: Math.random() * 4, vz: (Math.random() - 0.5) * 8, size: 0.3, sizeEnd: 0.1, life: 1, r: 0.42, g: 0.62, b: 0.48, alpha: 1, alphaEnd: 0, tex: TEX_PUFF, gravity: -5, drag: 1.2 });
        if (f === g.player) g.hud?.showBanner('Hihiō’s fur is shredded');
      }
      return true;
    }
    return false;
  }

  protected override applyStats(): void {
    super.applyStats();
    const f = this.f;
    if (this.soo) {
      f.power = 1.8 * (this.flare ? 1.25 : 1);
      f.damageTaken = 0.8;
      f.toughness = 10;
      f.aura.target = this.flare ? 0.85 : 0.18;
    } else f.power *= 1.1;
  }

  override formName(): string {
    return this.soo ? 'Bankai — Sōō Zabimaru' : super.formName();
  }

  override ai(): KitAI {
    const base = super.ai();
    const kit = this;
    const sk = () => this.soo;
    const oro = () => this.soo && this.orochiT > 0;
    const keep = base.moves.filter((m) => !['smash', 'taiho', 'bite', 'higa2', 'burrow'].includes(m.name));
    const moves: AIMove[] = [
      ...keep,
      { name: 'catch', use: () => this.skill3(), min: 0, max: 2.4, weight: 0.8, cd: 4, when: () => this.form === 'sealed' && !!this.target()?.busy },
      { name: 'punch', use: () => this.heavy(), min: 1.5, max: 4.6, weight: 2, cd: 2.6, when: () => sk() && !this.orochiT && !this.thrown },
      { name: 'orochi', use: () => this.skill1(), min: 0, max: 16, weight: 1.2, cd: 14, when: () => sk() && this.orochiT <= 0 },
      { name: 'snake', use: () => this.skill1(), min: 5, max: 19, weight: 1.6, cd: 4, when: oro },
      { name: 'throw', use: () => this.heavy(), min: 8, max: 34, weight: 1.4, cd: 5, when: () => oro() && !this.thrown },
      { name: 'reel', use: () => this.heavy(), min: 4, max: 40, weight: 4, cd: 1, when: () => this.thrown?.mode === 'pinned' },
      { name: 'zazekka', use: () => this.skill2(), min: 4, max: 19, weight: 1.6, cd: 4.5, when: () => sk() && !this.thrown },
      { name: 'tensho', use: () => this.skill3(), min: 6, max: 28, weight: 1.2, cd: 12, when: () => sk() && !this.zagai },
      { name: 'teppo', use: () => this.release(), min: 0, max: 3.2, weight: 2.2, cd: 8, when: () => sk() && (this.target()?.hp ?? 1) < (this.target()?.maxHp ?? 1) * 0.5 },
      { name: 'taiho', use: () => this.release(), min: 8, max: 60, weight: 1, cd: 8, when: sk },
      { name: 'zagai', use: () => this.toggle(), min: 8, max: 45, weight: 1.4, cd: 25, when: () => sk() && !this.zagai && (!!this.tensho?.held || this.f.hp < this.f.maxHp * 0.5) },
      { name: 'hurl', use: () => this.toggle(), min: 0, max: 60, weight: 6, cd: 1, when: () => !!this.zagai && (this.zagai.charge > 8 || (this.zagai.charge > 4 && !this.tensho?.held)) },
    ];
    return {
      get reach() {
        return kit.soo ? (kit.orochiT > 0 ? 2.6 : 2) : base.reach;
      },
      chain: 4,
      releaseAt: [1, 0.7],
      ranged: () => false,
      moves,
    };
  }

  override abilities(): AbilityInfo[] {
    if (!this.soo) {
      const list = super.abilities();
      if (this.form === 'sealed') list.splice(4, 0, { key: 'R', name: 'Catch', kanji: '捕', cost: 4, cd: this.cd2.catch, cdMax: 2.2 });
      return list;
    }
    const cd = this.cd2, oro = this.orochiT > 0;
    return [
      { key: 'LMB', name: oro ? 'Orochiō' : 'Arm blade', kanji: oro ? '大蛇' : '牙' },
      oro ? { key: 'RMB', name: this.thrown ? 'Reel' : 'Red-hot throw', kanji: this.thrown ? '引' : '投', cost: 16, cd: cd.throw, cdMax: 3 } : { key: 'RMB', name: 'Hihiō', kanji: '狒々王', cost: 14, cd: cd.punch, cdMax: 2.4 },
      oro ? { key: 'Q', name: 'Whip-snake', kanji: '蛇', cost: 14, cd: cd.snake, cdMax: 3 } : { key: 'Q', name: 'Orochiō', kanji: 'オロチ', cost: 16, cd: cd.orochi, cdMax: 14 },
      { key: 'E', name: 'Zazekka', kanji: '蛇舌', cost: 18, cd: cd.zazekka, cdMax: 4.5 },
      { key: 'R', name: 'Hihi Tenshō', kanji: '転生', cost: 26, cd: cd.tensho, cdMax: 12 },
      { key: 'F', name: 'Zaga Teppō / Taihō', kanji: '鉄炮', cost: 30, cd: Math.min(cd.teppo, cd.taiho), cdMax: 8 },
      { key: 'G', name: this.zagai ? 'Hurl' : 'Zagai Zekkō', kanji: '絶吼', cost: 40, cd: cd.zagai, cdMax: 30, active: !!this.zagai, tint: '#FF9A2E' },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
    ];
  }
}
