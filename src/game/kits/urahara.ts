// Urahara's kit (docs/roster/A3-urahara-shop-and-shiba.md §1, Kit proposal). Sealed, the shopkeeper with
// his cane: an unhurried string (swat, flick, cane-butt jab, front kick), the lunging thrust that knocks a
// target flat and pins it under the cane tip (Shitonegaeshi), and incantation-less Kidō — Shibireyubi (Q:
// a flash from a raised finger, paralysing), Jūgeki Byakurai (E: his red piercing beam), the bind chain
// (R: each press adds a layer — Rikujōkōrō, Sajō Sabaku, Kuyō Shibari), and the Portable Gigai (G: the next
// blow lands on an inflatable dummy while he reappears behind the attacker). F: "Okiro, Benihime" — Nake (RMB:
// the crimson wave, cancelling beams it meets), Chikasumi no Tate (Q: the blood-mist shield), Kamisori (E: a
// razor arc that turns in flight), Shibari (R: the net) and on a netted target Hiasobi Juzutsunagi (the
// fire-bead chain and the explosion), Tsuppane (G: the ring that cancels energy). F again: Bankai,
// Kannonbiraki Benihime Aratame — the curtain falls and the giant doll leans out over him: every cut lays a
// seam (RMB opens them all at once), Q has her hands seize and restructure the target, E rebuilds his own
// body, R sews a stitch rail to the target and rides it, G seals her hands round the target like shrine
// doors closing (the Kannonbiraki).
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { DamageOpts, Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { CANE_TIP_Z, SHIKAI_TIP_Z, uraharaAsset, uraharaProp } from '../../chars/urahara';
import { BENIHIME_CHAIN, BENIHIME_STANCE, URAHARA_CHAIN, URAHARA_CLIPS, URAHARA_STANCE } from '../../chars/uraharaClips';
import { BenihimeBankai, BloodNet, CRIMSON, HexShield, Juzutsunagi, RazorArc, Seam, TsuppaneRing, crimsonBurst } from '../../vfx/benihime';
import { Rikujokoro, Hainawa } from '../../vfx/rukiaArts';
import { MirrorDecoy } from '../../vfx/mirror';
import { GetsugaProjectile } from '../projectiles/getsuga';
import { CeroBeam } from '../projectiles/cero';
import { raycastVoxels } from '../../voxel/raycast';
import { SphereShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

export const AURA_URAHARA: AuraStyle = { core: '#FF4D5E', body: '#C8102E', rim: '#6A0A18' };
export const AURA_KANNON: AuraStyle = { core: '#FFD6DC', body: '#B2343F', rim: '#4A0C14', dark: '#16161A' };

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE_CANE: BladeDef = { prop: 'sword', base: [0, 0, 0.06], tip: [0, 0, CANE_TIP_Z], color: '#C9B98F', core: '#F3F3F0' };
const BLADE_SHIKAI: BladeDef = { prop: 'sword', base: [0, 0, 0.1], tip: [0, 0, SHIKAI_TIP_Z], color: '#D01E3C', core: '#FFD6DC' };
const BLADE_BANKAI: BladeDef = { prop: 'sword', base: [0, 0, 0.06], tip: [0, 0, CANE_TIP_Z], color: '#FF7A4A', core: '#FFE6EA' };

const BANKAI_TIME = 28;

export const URAHARA_DEF: FighterDef = {
  id: 'urahara',
  name: 'Kisuke Urahara',
  title: 'Urahara Shop',
  build: () => ({ asset: uraharaAsset(), props: [{ key: 'sword', model: uraharaProp('cane'), socket: 'grip.R' }, { key: 'fan', model: uraharaProp('fan'), socket: 'palm.L' }] }),
  stance: URAHARA_STANCE,
  clips: URAHARA_CLIPS,
  aura: AURA_URAHARA,
  blade: BLADE_CANE,
  hp: 1100,
  rei: 170,
  speed: { run: 11, sprint: 29, jump: 13, dash: 22, dashTime: 0.09 },
  radius: 0.34,
  height: 1.83,
};

type Form = 'sealed' | 'shikai' | 'bankai';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

interface MoveInfo {
  lunge: number;
  window?: [number, number];
  trail?: [number, number];
  spec?: BladeSpec;
  /** a kick or a jab: a sphere ahead of him */
  strike?: { damage: number; knock: number; launch?: number; heavy?: boolean; reach: number; height: number; radius: number };
}

const MOVES: Record<string, MoveInfo> = {
  ur_swat: { lunge: 5, window: [0.1, 0.22], trail: [0.08, 0.26], spec: { damage: 14, knock: 8, launch: 0, hitstop: 0.05, shake: 0.12, cut: 90, heavy: false } },
  ur_flick: { lunge: 6, window: [0.08, 0.18], trail: [0.06, 0.22], spec: { damage: 16, knock: 6, launch: 3, hitstop: 0.05, shake: 0.12, cut: 200 } },
  ur_jab: { lunge: 7, strike: { damage: 16, knock: 12, reach: 1.25, height: 1.3, radius: 0.7 } },
  ur_kick: { lunge: 7, strike: { damage: 20, knock: 16, launch: 3, heavy: true, reach: 0.95, height: 1.1, radius: 0.9 } },
  ur_b1: { lunge: 7, window: [0.08, 0.18], trail: [0.06, 0.24], spec: { damage: 20, knock: 7, launch: 0, hitstop: 0.05, shake: 0.12, cut: 320 } },
  ur_b2: { lunge: 7, window: [0.08, 0.18], trail: [0.06, 0.24], spec: { damage: 20, knock: 7, launch: 4, hitstop: 0.05, shake: 0.12, cut: 320 } },
  ur_b3: { lunge: 9, window: [0.11, 0.22], trail: [0.08, 0.26], spec: { damage: 24, knock: 12, launch: 1, hitstop: 0.06, shake: 0.16, cut: 360 } },
  ur_b4: { lunge: 7, window: [0.12, 0.24], trail: [0.1, 0.3], spec: { damage: 28, knock: 14, launch: 2, heavy: true, hitstop: 0.08, shake: 0.22, cut: 400 } },
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
  f.bladeValid = false;
}

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
  private hitAt = 0;
  private struck = false;
  private seen = new Set<number>();
  queued = false;

  constructor(readonly kit: UraharaKit, readonly clip: string, readonly index: number) {
    super();
    this.name = clip;
    this.info = MOVES[clip];
    this.mobility = 0.14;
    this.airGravity = 0.1;
  }

  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    this.hitAt = c.events.hit ?? this.dur * 0.4;
    f.bladeHits.clear();
    f.bladeSpec = this.info.spec ? this.kit.spec(this.info.spec) : null;
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n !== 'step') return;
        const tgt = f.faceTarget;
        const extra = tgt ? Math.min(5, Math.max(0, f.pos.distanceTo(tgt) - 1.6)) : 0;
        f.push.addScaledVector(f.forward(), this.info.lunge + extra * 2);
        g.sfx.play('swing', f.center(), 0.7);
      },
    });
  }

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t, info = this.info;
    if (info.window) {
      f.bladeActive = t >= info.window[0] && t <= info.window[1];
      if (f.trail && info.trail) f.trail.emitting = t >= info.trail[0] && t <= info.trail[1];
    }
    if (info.strike && !this.struck && t >= this.hitAt) {
      this.struck = true;
      const s = info.strike;
      const fw = f.forward(_w);
      const p = new THREE.Vector3().copy(f.pos).addScaledVector(fw, s.reach);
      p.y += s.height;
      for (const o of g.enemiesOf(f)) {
        const cy = Math.max(o.pos.y + 0.1, Math.min(o.pos.y + o.def.height - 0.2, p.y));
        if (Math.hypot(o.pos.x - p.x, cy - p.y, o.pos.z - p.z) > s.radius + o.def.radius) continue;
        const dir = _v.subVectors(o.pos, f.pos).setY(0).normalize();
        g.damage(o, s.damage, f, dir.clone(), { knock: s.knock, launch: s.launch, heavy: s.heavy, hitstop: 0.06, shake: 0.2 });
        this.kit.onHit(o);
      }
    }
    for (const id of f.bladeHits) {
      if (this.seen.has(id)) continue;
      this.seen.add(id);
      const o = g.fighters.find((x) => x.id === id);
      if (o) this.kit.onHit(o);
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
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= (this.info.window?.[0] ?? this.hitAt) + 0.04;
    return false;
  }
}

abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: UraharaKit) {
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
    this.kit.fan(true);
  }
}

/** RMB (cane): the lunging thrust; a target it knocks down is pinned under the cane tip (Shitonegaeshi). */
class PinAction extends SkillAction {
  readonly name = 'pin';
  private pinned: Fighter | null = null;
  private hits = new Set<number>();
  constructor(kit: UraharaKit) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ur_pin', (n) => {
      if (n === 'step') {
        f.push.addScaledVector(f.forward(), 13);
        g.sfx.play('swingHeavy', f.center(), 1);
      }
      if (n === 'hit') {
        const fw = f.forward(_w);
        const p = f.pos.clone().addScaledVector(fw, 1.4).setY(f.pos.y + 1.2);
        for (const o of g.enemiesOf(f)) {
          if (this.hits.has(o.id)) continue;
          const cy = Math.max(o.pos.y + 0.1, Math.min(o.pos.y + o.def.height - 0.2, p.y));
          if (Math.hypot(o.pos.x - p.x, cy - p.y, o.pos.z - p.z) > 0.9 + o.def.radius) continue;
          this.hits.add(o.id);
          g.damage(o, 26, f, fw.clone(), { knock: 4, heavy: true, hitstop: 0.08, shake: 0.3 });
          this.pinned ??= o;
        }
      }
      if (n === 'pin' && this.pinned && !this.pinned.dead) {
        // flat on the ground, the cane tip a hair from the face: it dares not move
        const o = this.pinned;
        o.hitstun = Math.max(o.hitstun, 1.4);
        o.anim.play('hit_heavy', { fadeIn: 0.05 });
        g.callout('褥返し', 'SHITONEGAESHI', '#f3e9d8');
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const o = this.pinned;
    if (o && !o.dead && this.t > 0.5 && this.t < 1.1) {
      o.body.vel.set(0, Math.min(0, o.body.vel.y), 0);
      o.push.set(0, 0, 0);
    }
  }
}

/** Q (sealed): Shibireyubi — a finger raised before the face, a white flash, and those close drop paralysed. */
class ShibireAction extends SkillAction {
  readonly name = 'shibire';
  constructor(kit: UraharaKit) {
    super(kit);
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.fan(false);
    this.playClip(f, 'ur_finger', (n) => {
      if (n !== 'cast') return;
      const p = sock(f, 'finger.L');
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.5, sizeEnd: 5, life: 0.25, r: 1, g: 1, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
      const fw = f.forward(_w);
      for (const o of g.enemiesOf(f)) {
        const to = _v.subVectors(o.pos, f.pos).setY(0);
        const d = to.length();
        if (d > 5 || (d > 0.5 && to.normalize().dot(fw) < 0.2)) continue;
        g.damage(o, 8, f, to.clone(), { knock: 0, hitstop: 0.06, color: '#FFFFFF' });
        // conscious, but every muscle numb
        o.hitstun = Math.max(o.hitstun, 1.8);
        o.anim.play('hit_heavy', { fadeIn: 0.05 });
      }
      g.sfx.play('crack', p, 0.6);
      if (g.player && (f === g.player || g.player.pos.distanceTo(f.pos) < 6)) g.engine.gr.chroma.offset.set(0.005, 0.005);
    });
  }
}

/** E (sealed): Jūgeki Byakurai — the red piercing beam from the fingertip. */
class ByakuraiAction extends SkillAction {
  readonly name = 'byakurai';
  constructor(kit: UraharaKit) {
    super(kit);
    this.mobility = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.fan(false);
    this.playClip(f, 'ur_palm', (n) => {
      if (n !== 'cast') return;
      const emitter = f.visual.rig.sockets.get('finger.L')!;
      g.addProjectile(new CeroBeam(g, f, emitter, () => aim(f, g), { charge: 0.05, fire: 0.32, radius: 0.24, damage: 70, power: 900, core: '#FFFFFF', body: '#E8283A', rim: '#8A1020', range: 140, track: 0.5, gain: 1.6 }));
      g.callout('重撃白雷', 'JŪGEKI BYAKURAI', '#e8283a');
    });
  }
}

/** R (sealed): the bind chain — a new layer of Bakudō with each press. */
class BindAction extends SkillAction {
  readonly name = 'bind';
  constructor(kit: UraharaKit, readonly target: Fighter, readonly layer: number) {
    super(kit);
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.fan(false);
    this.playClip(f, 'ur_bind', (n) => {
      if (n !== 'cast') return;
      const t = this.target;
      if (t.dead) return;
      if (this.layer === 0) {
        this.kit.binding = new Rikujokoro(g, f, t, 2.2);
        g.addProjectile(this.kit.binding);
        g.callout('六杖光牢', 'BAKUDŌ #61 — RIKUJŌKŌRŌ', '#fff2a6');
      } else if (this.layer === 1) {
        const rope = new Hainawa(g, f, () => sock(f, 'palm.L'), t, 2.4);
        g.addProjectile(rope);
        this.kit.extendBind(1.6);
        g.callout('鎖条鎖縛', 'BAKUDŌ #63 — SAJŌ SABAKU', '#f2d23c');
      } else {
        g.addProjectile(new KuyoShibari(g, f, t, 2.4));
        this.kit.extendBind(2);
        g.callout('九曜縛', 'BAKUDŌ #79 — KUYŌ SHIBARI', '#8e4fd8');
      }
    });
  }
}

/** Bakudō #79 Kuyō Shibari: eight black holes with purple rims round the target and a ninth on its chest. */
export class KuyoShibari {
  done = false;
  private t = 0;
  private discs: THREE.Mesh[] = [];
  private mat: THREE.MeshBasicMaterial;
  private rim: THREE.MeshBasicMaterial;
  private hold = new THREE.Vector3();
  constructor(private g: Game, private owner: Fighter, readonly target: Fighter, readonly dur = 2.4) {
    const geo = new THREE.CircleGeometry(0.3, 20);
    const ring = new THREE.RingGeometry(0.3, 0.38, 20);
    this.mat = new THREE.MeshBasicMaterial({ color: '#0A0A0F', side: THREE.DoubleSide });
    this.rim = new THREE.MeshBasicMaterial({ color: new THREE.Color('#8E4FD8').multiplyScalar(2), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    for (let i = 0; i < 9; i++) {
      const d = new THREE.Mesh(geo, this.mat);
      d.add(new THREE.Mesh(ring, this.rim));
      d.frustumCulled = false;
      g.engine.gr.scene.add(d);
      this.discs.push(d);
    }
    this.hold.copy(target.pos);
    g.damage(target, 18, owner, new THREE.Vector3(), { knock: 0, hitstop: 0.08, color: '#8E4FD8' });
    g.sfx.play('crack', target.center(), 1);
  }
  update(dt: number): void {
    this.t += dt;
    const tg = this.target;
    if (!tg.dead && this.t < this.dur) {
      tg.body.pos.x = this.hold.x;
      tg.body.pos.z = this.hold.z;
      tg.body.vel.set(0, Math.min(0, tg.body.vel.y), 0);
      tg.push.set(0, 0, 0);
      tg.hitstun = Math.max(tg.hitstun, 0.25);
    }
    if (this.t > this.dur + 0.2 || tg.dead) this.done = true;
  }
  render(): void {
    const tg = this.target;
    const c = tg.center();
    const cam = this.g.engine.gr.camera.position;
    const k = Math.min(1, this.t / 0.15) * (this.t > this.dur ? Math.max(0, 1 - (this.t - this.dur) / 0.2) : 1);
    const toCam = new THREE.Vector3(cam.x - c.x, 0, cam.z - c.z).normalize();
    const side = new THREE.Vector3(-toCam.z, 0, toCam.x);
    for (let i = 0; i < 9; i++) {
      const d = this.discs[i];
      if (i === 8) d.position.copy(c).addScaledVector(toCam, tg.def.radius + 0.05);
      else {
        const a = (i / 8) * Math.PI * 2;
        d.position.copy(c).addScaledVector(side, Math.cos(a) * 1.1).add(new THREE.Vector3(0, Math.sin(a) * 1.1, 0)).addScaledVector(toCam, 0.3);
      }
      d.lookAt(cam);
      d.scale.setScalar(Math.max(0.01, k));
    }
  }
  dispose(): void {
    for (const d of this.discs) d.removeFromParent();
    this.discs[0]?.geometry.dispose();
    this.mat.dispose();
    this.rim.dispose();
  }
}

/** G (sealed): the Portable Gigai is armed — the next blow lands on an inflating dummy. */
class GigaiAction extends SkillAction {
  readonly name = 'gigai';
  constructor(kit: UraharaKit) {
    super(kit);
    this.mobility = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ur_gigai', (n) => {
      if (n !== 'arm') return;
      this.kit.gigaiT = 3;
      const p = f.center();
      g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, size: 0.4, sizeEnd: 1.2, life: 0.4, r: 0.9, g: 0.88, b: 0.85, alpha: 0.4, alphaEnd: 0, tex: TEX_PUFF });
      g.sfx.play('shunpo', p, 0.4);
    });
  }
}

/** F: "Okiro, Benihime" — the blade drawn out of the cane. */
class OkiroAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: UraharaKit) {
    super(kit);
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ur_okiro', (n) => {
      if (n === 'draw') g.sfx.play('swing', f.center(), 0.8);
      if (n === 'wake') this.kit.becomeShikai();
    });
  }
}

/** RMB (Shikai): Nake, Benihime — the crimson wave; it cancels any beam it meets. */
class NakeAction extends SkillAction {
  readonly name = 'nake';
  constructor(kit: UraharaKit) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = this.kit.spec({ damage: 22, knock: 10, launch: 1, hitstop: 0.06, shake: 0.2, cut: 380 });
    this.playClip(f, 'ur_nake', (n) => {
      if (n === 'step') g.sfx.play('swingHeavy', f.center(), 1);
      if (n !== 'hit') return;
      const from = f.center().addScaledVector(f.forward(_w), 0.8);
      const dir = aim(f, g).sub(from);
      dir.y *= 0.4;
      dir.normalize();
      const side = new THREE.Vector3(-dir.z, 0, dir.x);
      const big = this.kit.form === 'bankai';
      g.addProjectile(new NakeWave(g, f, from, dir, side, big));
      g.callout('啼け紅姫', 'NAKE, BENIHIME', '#d01e3c');
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    f.bladeActive = this.t >= 0.18 && this.t <= 0.3;
    if (f.trail) f.trail.emitting = this.t >= 0.14 && this.t <= 0.34;
  }
}

/** Nake's wave: a Getsuga-like crimson crescent that also snuffs out any beam or shot it passes through. */
class NakeWave extends GetsugaProjectile {
  constructor(private gg: Game, private ow: Fighter, from: THREE.Vector3, dir: THREE.Vector3, side: THREE.Vector3, big: boolean) {
    super(gg, ow, from, dir, side, { radius: big ? 3.4 : 2.6, halfAngle: 1.05, speed: 44, range: 60, damage: big ? 80 : 58, cut: 520, colors: CRIMSON });
  }
  override update(dt: number, g: Game): void {
    super.update(dt, g);
    for (const p of g.projectiles as { pos?: THREE.Vector3; owner?: Fighter; done: boolean }[]) {
      if ((p as unknown) === this || p.done || !(p.pos instanceof THREE.Vector3) || p.owner === this.ow) continue;
      if (p.pos.distanceTo(this.pos) > 2.6) continue;
      p.done = true;
      crimsonBurst(g, p.pos.clone(), 1.5);
      g.sfx.play('explode', p.pos, 0.8);
    }
  }
}

/** Q (Shikai): Chikasumi no Tate — the shield stands before the blade; frontal blows stop on it. */
class ShieldAction extends SkillAction {
  readonly name = 'shield';
  shield: HexShield | null = null;
  constructor(kit: UraharaKit) {
    super(kit);
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ur_shield', (n) => {
      if (n === 'raise') {
        this.shield = new HexShield(g, f, 0.95, 1.6);
        g.addProjectile(this.shield);
        g.callout('血霞の盾', 'CHIKASUMI NO TATE', '#ff5a6e');
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.shield || this.shield.done || this.t > 1.0) return;
    // shots that reach the shield break on it
    const c = f.center().addScaledVector(f.forward(_w), 0.9);
    for (const p of g.projectiles as { pos?: THREE.Vector3; owner?: Fighter; done: boolean }[]) {
      if (p.done || !(p.pos instanceof THREE.Vector3) || p.owner === f) continue;
      if (p.pos.distanceTo(c) > 1.9) continue;
      p.done = true;
      this.shield.flash();
      crimsonBurst(g, p.pos.clone(), 1);
      g.sfx.play('ting', p.pos, 0.9);
    }
  }
  override end(f: Fighter): void {
    super.end(f);
    if (this.shield) this.shield.done = true;
  }
  /** frontal blows stop on the shield while it stands */
  blocks(from: Fighter | null): boolean {
    if (!this.shield || this.shield.done || this.t > 1.0 || !from) return false;
    const f = this.kit.f;
    _v.subVectors(from.pos, f.pos).setY(0);
    return _v.lengthSq() < 1e-4 || _v.normalize().dot(f.forward(_w)) > 0.2;
  }
}

/** E (Shikai): Kamisori, Benihime — the thin arc that re-aims in flight. */
class KamisoriAction extends SkillAction {
  readonly name = 'kamisori';
  constructor(kit: UraharaKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ur_kamisori', (n) => {
      if (n !== 'hit') return;
      const from = f.center().addScaledVector(f.forward(_w), 0.9);
      const d = aim(f, g).sub(from).normalize();
      // thrown off to the side; it turns back on the target
      d.addScaledVector(new THREE.Vector3(-d.z, 0, d.x), 0.6).normalize();
      g.addProjectile(new RazorArc(g, f, from, d, this.target, this.kit.form === 'bankai' ? 46 : 34));
      g.callout('剃刀紅姫', 'KAMISORI, BENIHIME', '#e0203a');
    });
  }
}

/** R (Shikai): Shibari, Benihime — the net thrown down over the target. */
class ShibariAction extends SkillAction {
  readonly name = 'shibari';
  constructor(kit: UraharaKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ur_shibari', (n) => {
      if (n !== 'hit' || this.target.dead) return;
      this.kit.net = new BloodNet(g, f, this.target, 2.8);
      g.addProjectile(this.kit.net);
      g.callout('縛り紅姫', 'SHIBARI, BENIHIME', '#c8102e');
      g.sfx.play('swingHeavy', f.center(), 0.9);
    });
  }
}

/** R on a netted target: Hiasobi, Benihime, Juzutsunagi — the blade stabbed down, the fire beads lit. */
class HiasobiAction extends SkillAction {
  readonly name = 'hiasobi';
  constructor(kit: UraharaKit, readonly net: BloodNet) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ur_stab', (n) => {
      if (n !== 'stab' || this.net.done) return;
      const tip = f.bladeValid ? f.blade.tip.clone() : f.pos.clone().addScaledVector(f.forward(_w), 1);
      g.addProjectile(new Juzutsunagi(g, f, tip, this.net, this.kit.form === 'bankai' ? 190 : 150));
      g.callout('火遊紅姫 数珠繋', 'HIASOBI, BENIHIME — JUZUTSUNAGI', '#f37436');
      crimsonBurst(g, tip, 1);
    });
  }
}

/** G (Shikai): Tsuppane, Benihime — the edge draws a ring; the energy that reaches it is cancelled. */
class TsuppaneAction extends SkillAction {
  readonly name = 'tsuppane';
  constructor(kit: UraharaKit) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    g.addProjectile(new TsuppaneRing(g, f, 1.3, 1.3));
    g.callout('突ッ撥紅姫', 'TSUPPANE, BENIHIME', '#e0506e');
    this.playClip(f, 'ur_tsuppane', () => {});
  }
}

/** F again: Bankai — the curtain falls behind him and the doll leans out of it. */
class BankaiAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: UraharaKit) {
    super(kit);
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    g.callout('卍解', 'BANKAI', '#ffd6dc');
    this.playClip(f, 'ur_bankai', (n) => {
      if (n === 'curtain') this.kit.becomeBankai();
      if (n === 'doll') g.callout('観音開紅姫改メ', 'KANNONBIRAKI BENIHIME ARATAME', '#ffd6dc');
    });
  }
}

/** Bankai RMB: "Open" — every seam laid on the target unzips at once. */
class OpenAction extends SkillAction {
  readonly name = 'open';
  constructor(kit: UraharaKit) {
    super(kit);
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ur_tsuppane', (n) => {
      if (n !== 'hit') return;
      this.kit.openSeams();
    }, 1.3);
  }
}

/** Bankai Q: her hands seize the target and restructure it. */
class DismantleAction extends SkillAction {
  readonly name = 'dismantle';
  private grabbed = false;
  constructor(kit: UraharaKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0.2;
    this.dur = 1.6;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ur_bind', () => {});
    this.dur = 1.6;
    g.callout('改メ', 'RESTRUCTURE', '#ffd6dc');
    g.sfx.play('charge', f.center(), 0.7);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const doll = this.kit.doll;
    const t = this.target;
    if (!doll || t.dead) return;
    const k = Math.min(1, this.t / 0.45);
    doll.reach('L', t.center(), k);
    doll.reach('R', t.center(), k);
    if (!this.grabbed && this.t >= 0.45) {
      this.grabbed = true;
      g.damage(t, 60, f, new THREE.Vector3(0, 1, 0), { knock: 0, heavy: true, hitstop: 0.16, shake: 0.5, color: '#FF7A4A' });
      // rewired: it moves at half speed and cannot flash-step for a while
      this.kit.restructure(t);
      crimsonBurst(g, t.center(), 2);
      g.sfx.play('crack', t.center(), 1.2);
    }
    if (this.grabbed && this.t < 1.2) {
      t.body.vel.set(0, Math.max(t.body.vel.y, 0), 0);
      t.push.set(0, 0, 0);
      t.hitstun = Math.max(t.hitstun, 0.3);
      const hp = doll.hand('L').add(doll.hand('R')).multiplyScalar(0.5);
      t.body.pos.lerp(new THREE.Vector3(hp.x, Math.max(t.pos.y, hp.y - t.def.height * 0.5), hp.z), Math.min(1, dt * 6));
    }
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.doll?.reach('L', null);
    this.kit.doll?.reach('R', null);
  }
}

/** Bankai E: the doll's hands rebuild his body. */
class RebuildAction extends SkillAction {
  readonly name = 'rebuild';
  constructor(kit: UraharaKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ur_gigai', () => {});
    this.dur = 1.0;
    const heal = f.maxHp * 0.16;
    f.hp = Math.min(f.maxHp, f.hp + heal);
    this.kit.empowered = 3;
    g.callout('改メ', 'SELF-RESTRUCTURE', '#ffd6dc');
    const c = f.center();
    for (let i = 0; i < 4; i++) g.addProjectile(new Seam(g, c.clone().add(new THREE.Vector3(-0.3, 0.5 - i * 0.3, 0.3)), c.clone().add(new THREE.Vector3(0.3, 0.4 - i * 0.3, 0.3)), 1.2));
    g.sfx.play('purify', c, 1);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.kit.doll?.reach('L', f.center(), Math.min(1, this.t / 0.3) * 0.8);
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.doll?.reach('L', null);
  }
}

/** Bankai R: a stitch rail sewn to the target, ridden at speed straight into a cut. */
class RailAction extends SkillAction {
  readonly name = 'rail';
  private from = new THREE.Vector3();
  private to = new THREE.Vector3();
  private hits = new Set<number>();
  constructor(kit: UraharaKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0;
    this.trackTarget = false;
    this.airGravity = 0;
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    this.from.copy(f.pos);
    const d = new THREE.Vector3().subVectors(this.target.pos, f.pos).setY(0);
    const len = d.length();
    d.normalize();
    this.to.copy(f.pos).addScaledVector(d, Math.max(0, len - 1.1));
    this.to.y = this.target.pos.y;
    g.addProjectile(new Seam(g, this.from.clone().setY(this.from.y + 0.15), this.to.clone().setY(this.to.y + 0.15), 1.6));
    f.yaw = Math.atan2(d.x, d.z);
    f.bladeHits.clear();
    f.bladeSpec = this.kit.spec({ damage: 30, knock: 12, launch: 3, heavy: true, hitstop: 0.08, shake: 0.3, cut: 420 });
    const inst = f.anim.play('ur_b3', { fadeIn: 0.03 });
    if (inst) inst.time = 0.05;
    this.dur = 0.6;
    g.sfx.play('shunpo', f.center(), 1);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const k = Math.min(1, this.t / 0.2);
    const p = new THREE.Vector3().lerpVectors(this.from, this.to, 1 - (1 - k) * (1 - k));
    teleport(f, p);
    f.ghosts.spawn(0.2, 0.7);
    f.bladeActive = this.t > 0.12 && this.t < 0.3;
    if (f.trail) f.trail.emitting = this.t > 0.1 && this.t < 0.34;
    for (const id of f.bladeHits) {
      if (this.hits.has(id)) continue;
      this.hits.add(id);
      const o = g.fighters.find((x) => x.id === id);
      if (o) this.kit.onHit(o);
    }
  }
}

/** Bankai G: the Kannonbiraki — her hands close round the target like shrine doors, then open on it remade. */
class KannonAction extends SkillAction {
  readonly name = 'kannon';
  private closed = false;
  private opened = false;
  constructor(kit: UraharaKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.6;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ur_bankai', () => {}, 1.2);
    g.callout('観音開', 'KANNONBIRAKI', '#ffd6dc');
    g.sfx.play('charge', f.center(), 1.2);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const doll = this.kit.doll;
    const t = this.target;
    if (!doll) return;
    const c = t.center();
    const side = new THREE.Vector3(-f.forward(_w).z, 0, f.forward(_w).x);
    const close = Math.min(1, this.t / 0.6);
    doll.reach('L', c.clone().addScaledVector(side, 1.6 * (1 - close) + 0.3), Math.min(1, this.t / 0.3));
    doll.reach('R', c.clone().addScaledVector(side, -1.6 * (1 - close) - 0.3), Math.min(1, this.t / 0.3));
    if (!t.dead && this.t < 1.3) {
      t.body.vel.set(0, Math.min(0, t.body.vel.y), 0);
      t.push.set(0, 0, 0);
      t.hitstun = Math.max(t.hitstun, 0.3);
    }
    if (!this.closed && this.t >= 0.6) {
      this.closed = true;
      g.sfx.play('impact', c, 1.4);
      g.shake(0.4);
    }
    if (!this.opened && this.t >= 1.1) {
      this.opened = true;
      if (!t.dead) {
        g.damage(t, 150, f, new THREE.Vector3(0, 1, 0), { knock: 6, launch: 8, heavy: true, hitstop: 0.18, shake: 0.7, color: '#FF7A4A' });
        this.kit.restructure(t, 8);
      }
      crimsonBurst(g, c, 3);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.addProjectile(new Seam(g, c.clone().add(new THREE.Vector3(Math.cos(a) * 0.3, 0.8, Math.sin(a) * 0.3)), c.clone().add(new THREE.Vector3(Math.cos(a) * 0.4, -0.8, Math.sin(a) * 0.4)), 2.5));
      }
      g.engine.destruction.carve(new SphereShape(c.clone(), 2.4, 0.8), { mode: 'explode', power: 300, impulse: 12 });
      g.slowMo(0.25, 0.35);
    }
  }
  override end(f: Fighter): void {
    super.end(f);
    this.kit.doll?.reach('L', null);
    this.kit.doll?.reach('R', null);
  }
}

// ------------------------------------------------------------------ the kit

export class UraharaKit implements Kit {
  form: Form = 'sealed';
  flare = false;
  comboIndex = 0;
  bankaiT = 0;
  /** the Portable Gigai is armed for this long */
  gigaiT = 0;
  /** the current bind chain on a target, and its layers */
  binding: Rikujokoro | null = null;
  private bindLayer = 0;
  private bindExtra = 0;
  net: BloodNet | null = null;
  doll: BenihimeBankai | null = null;
  /** Bankai: seams laid on each target */
  private seams = new Map<number, number>();
  /** restructured targets: their speed is halved until the time runs out */
  private rewired = new Map<number, { f: Fighter; until: number; speed: FighterDef['speed'] }>();
  /** Bankai E: the next blows are much stronger */
  empowered = 0;
  private lastEnd = 0;
  private cd = { heavy: 0, shibire: 0, byakurai: 0, bind: 0, gigai: 0, nake: 0, shield: 0, kamisori: 0, shibari: 0, tsuppane: 0, dismantle: 0, rebuild: 0, rail: 0, kannon: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    this.setHands();
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
    this.gigaiT = Math.max(0, this.gigaiT - dt);
    if (this.binding?.done) {
      this.binding = null;
      this.bindLayer = 0;
    }
    if (this.net?.done) this.net = null;
    for (const [id, r] of this.rewired) {
      if (g.time < r.until && !r.f.dead) continue;
      r.f.def = { ...r.f.def, speed: r.speed };
      this.rewired.delete(id);
    }
    if (this.form === 'bankai') {
      this.bankaiT -= dt;
      if (this.bankaiT <= 0 && !f.busy) this.endBankai();
    }
    void this.bindExtra;
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 80, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 80);
  }

  private near(range: number): Fighter | null {
    const t = this.target();
    return t && t.pos.distanceTo(this.f.pos) <= range ? t : null;
  }

  private setHands(): void {
    const rig = this.f.visual.rig;
    rig.setBoneVisible('fist.R', true);
    rig.setBoneVisible('palm.R', false);
    rig.setBoneVisible('fist.L', false);
    rig.setBoneVisible('palm.L', true);
  }

  /** a blade spec scaled by the Bankai's self-restructure */
  spec(s: BladeSpec): BladeSpec {
    if (this.empowered <= 0) return s;
    return { ...s, damage: s.damage * 1.6, knock: s.knock * 1.8, launch: s.launch + 3, heavy: true };
  }

  /** a blow landed */
  onHit(o: Fighter): void {
    const { g } = this;
    if (this.empowered > 0) this.empowered--;
    if (this.form !== 'bankai' || o.dead) return;
    // every cut lays a seam on the target
    const n = Math.min(5, (this.seams.get(o.id) ?? 0) + 1);
    this.seams.set(o.id, n);
    const c = o.center();
    const a = Math.random() * Math.PI * 2;
    const d = new THREE.Vector3(Math.cos(a) * 0.3, (Math.random() - 0.5) * 0.6, Math.sin(a) * 0.3);
    g.addProjectile(new Seam(g, c.clone().add(d), c.clone().sub(d), 4));
  }

  /** Bankai RMB: every seam on every target opens at once. */
  openSeams(): void {
    const { f, g } = this;
    let any = false;
    for (const o of g.enemiesOf(f)) {
      const n = this.seams.get(o.id) ?? 0;
      if (!n || o.dead) continue;
      any = true;
      g.damage(o, 22 * n + 10, f, new THREE.Vector3(0, 1, 0), { knock: 4, launch: 2 + n, heavy: n >= 3, hitstop: 0.06 + n * 0.02, shake: 0.2 + n * 0.06, color: '#FF7A4A' });
      crimsonBurst(g, o.center(), 0.6 + n * 0.3);
      if (n >= 3) this.restructure(o, 3);
      this.seams.delete(o.id);
    }
    g.callout('開', any ? 'OPEN' : 'NO SEAMS', '#ff7a4a');
    if (any) g.sfx.play('crack', f.center(), 1.2);
  }

  /** a target rewired: half speed for `s` seconds */
  restructure(o: Fighter, s = 5): void {
    const r = this.rewired.get(o.id);
    const speed = r ? r.speed : { ...o.def.speed };
    this.rewired.set(o.id, { f: o, until: this.g.time + s, speed });
    o.def = { ...o.def, speed: { ...speed, run: speed.run * 0.5, sprint: speed.sprint * 0.5, dash: speed.dash * 0.35 } };
  }

  extendBind(s: number): void {
    this.bindExtra += s;
    const b = this.binding as unknown as { dur: number } | null;
    if (b) (b as { dur: number }).dur += s;
  }

  /** The Portable Gigai: the blow lands on a dummy and he is already behind the attacker. Also the Shikai shield. */
  private tryParry(amount: number, from: Fighter | null, o: DamageOpts): boolean {
    const { f, g } = this;
    if (f.action instanceof ShieldAction && f.action.blocks(from)) {
      f.action.shield?.flash();
      const p = f.center().addScaledVector(f.forward(_w), 0.9);
      crimsonBurst(g, p, 1);
      g.sfx.play('ting', p, 1);
      if (from && from.pos.distanceTo(f.pos) < 3.5) {
        from.hitstun = Math.max(from.hitstun, 0.35);
        from.push.addScaledVector(_v.subVectors(from.pos, f.pos).setY(0).normalize(), 6);
      }
      return true;
    }
    if (this.gigaiT <= 0 || !from || o.quiet || f.dead) return false;
    this.gigaiT = 0;
    // the dummy takes it, and swells and pops
    g.addProjectile(new MirrorDecoy(g, f, 0.25, 'shell'));
    const back = from.forward().multiplyScalar(-1);
    const go = clearance(g, from.pos, back, 1.3);
    const p = from.pos.clone().addScaledVector(back, Math.max(0.7, go));
    f.stopAction();
    teleport(f, p);
    f.yaw = Math.atan2(from.pos.x - p.x, from.pos.z - p.z);
    f.ghosts.spawn(0.3, 1);
    g.sfx.play('shunpo', f.center(), 0.8);
    g.callout('携帯用義骸', 'PORTABLE GIGAI', '#f3e9d8');
    void amount;
    return true;
  }

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof StringAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.form === 'sealed' ? URAHARA_CHAIN : BENIHIME_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.8;
    this.f.act(new StringAction(this, list[idx], idx), true);
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

  /** RMB: the pin / Nake / (Bankai) Open. */
  heavy(): void {
    const f = this.f;
    if (f.busy && !(f.action instanceof StringAction)) return;
    if (this.form === 'sealed') this.special(new PinAction(this), 6, 'heavy', 2);
    else if (this.form === 'shikai') this.special(new NakeAction(this), 16, 'nake', 2.4);
    else if (this.seams.size) this.special(new OpenAction(this), 12, 'heavy', 1.5);
    else this.special(new NakeAction(this), 18, 'nake', 2.4);
  }

  /** Q: Shibireyubi / Chikasumi no Tate / (Bankai) Dismantle. */
  skill1(): void {
    if (this.form === 'sealed') this.special(new ShibireAction(this), 10, 'shibire', 5);
    else if (this.form === 'shikai') this.special(new ShieldAction(this), 10, 'shield', 3);
    else {
      const t = this.near(14);
      if (t) this.special(new DismantleAction(this, t), 24, 'dismantle', 7);
    }
  }

  /** E: Jūgeki Byakurai / Kamisori / (Bankai) self-restructure. */
  skill2(): void {
    if (this.form === 'sealed') this.special(new ByakuraiAction(this), 16, 'byakurai', 3.5);
    else if (this.form === 'shikai') this.special(new KamisoriAction(this, this.near(60)), 12, 'kamisori', 2);
    else this.special(new RebuildAction(this), 20, 'rebuild', 12);
  }

  /** R: the bind chain / Shibari → Juzutsunagi / (Bankai) the stitch rail. */
  skill3(): void {
    if (this.form === 'sealed') {
      const t = this.binding && !this.binding.done ? this.binding.target : this.near(20);
      if (!t) return;
      const layer = this.binding && !this.binding.done ? this.bindLayer : 0;
      if (layer > 2) return;
      if (this.special(new BindAction(this, t, layer), 10 + layer * 6, 'bind', layer < 2 ? 0.6 : 8)) this.bindLayer = layer + 1;
    } else if (this.form === 'shikai') {
      if (this.net && !this.net.done && this.net.caught && !this.net.lit) this.special(new HiasobiAction(this, this.net), 28, 'shibari', 9);
      else {
        const t = this.near(22);
        if (t) this.special(new ShibariAction(this, t), 14, 'shibari', 0.8);
      }
    } else {
      const t = this.near(30);
      if (t) this.special(new RailAction(this, t), 12, 'rail', 3);
    }
  }

  /** G: the Portable Gigai / Tsuppane / (Bankai) Kannonbiraki. */
  toggle(): void {
    if (this.form === 'sealed') this.special(new GigaiAction(this), 12, 'gigai', 8);
    else if (this.form === 'shikai') this.special(new TsuppaneAction(this), 14, 'tsuppane', 5);
    else {
      const t = this.near(16);
      if (t) this.special(new KannonAction(this, t), 40, 'kannon', 14);
    }
  }

  release(): void {
    const f = this.f;
    if (this.form === 'bankai' || f.busy) return;
    if (!f.spendRei(this.form === 'sealed' ? 20 : 60)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(this.form === 'sealed' ? new OkiroAction(this) : new BankaiAction(this), true);
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

  /** the folding fan in his left hand (sealed only): put away while that hand casts */
  fan(on: boolean): void {
    const p = this.f.visual.props.get('fan');
    if (p) p.visible = on;
  }

  becomeShikai(): void {
    const { f, g } = this;
    if (this.form !== 'sealed') return;
    this.form = 'shikai';
    f.visual.detach('fan');
    f.visual.attach('sword', uraharaProp('shikai'), 'grip.R');
    f.def = { ...f.def, blade: BLADE_SHIKAI, stance: BENIHIME_STANCE };
    f.anim.loco.stance = BENIHIME_STANCE;
    f.trail?.setColor(BLADE_SHIKAI.color, BLADE_SHIKAI.core);
    f.bladeValid = false;
    crimsonBurst(g, sock(f, 'grip.R'), 2);
    g.addRing(f.pos.clone(), 10, '#D01E3C', 0.45);
    f.aura.flare(1.4, 0.6);
    g.sfx.play('flare', f.center(), 0.9);
    g.callout('起きろ「紅姫」', 'OKIRO, BENIHIME', '#d01e3c');
    this.applyStats();
  }

  becomeBankai(): void {
    const { f, g } = this;
    if (this.form !== 'shikai') return;
    this.form = 'bankai';
    this.bankaiT = BANKAI_TIME;
    f.visual.attach('sword', uraharaProp('cane-blade'), 'grip.R');
    f.def = { ...f.def, blade: BLADE_BANKAI, aura: AURA_KANNON };
    f.aura.setStyle(AURA_KANNON);
    f.trail?.setColor(BLADE_BANKAI.color, BLADE_BANKAI.core);
    f.bladeValid = false;
    this.doll = new BenihimeBankai(g, f);
    g.addProjectile(this.doll);
    f.aura.flare(2, 1);
    g.sfx.play('bankai', f.center());
    g.shake(f === g.player ? 0.5 : 0.2);
    g.slowMo(0.35, 0.4);
    g.engine.gr.chroma.offset.set(0.004, 0.004);
    this.applyStats();
  }

  private endBankai(): void {
    const { f, g } = this;
    this.form = 'shikai';
    this.doll?.end();
    this.doll = null;
    this.seams.clear();
    this.cd.kannon = 0;
    f.visual.attach('sword', uraharaProp('shikai'), 'grip.R');
    f.def = { ...f.def, blade: BLADE_SHIKAI, aura: AURA_URAHARA };
    f.aura.setStyle(AURA_URAHARA);
    f.trail?.setColor(BLADE_SHIKAI.color, BLADE_SHIKAI.core);
    f.bladeValid = false;
    if (f === g.player) g.hud?.showBanner('The curtain closes');
    this.applyStats();
  }

  private applyStats(): void {
    const f = this.f;
    const fm = this.form;
    f.power = (fm === 'bankai' ? 1.45 : fm === 'shikai' ? 1.2 : 1) * (this.flare ? 1.25 : 1);
    f.damageTaken = fm === 'bankai' ? 0.85 : 1;
    f.toughness = fm === 'bankai' ? 6 : 0;
    f.aura.target = this.flare ? 0.9 : fm === 'bankai' ? 0.45 : fm === 'shikai' ? 0.16 : 0.05;
  }

  formName(): string {
    if (this.form === 'bankai') return `Bankai — Kannonbiraki Benihime Aratame · ${Math.max(0, Math.ceil(this.bankaiT))} s`;
    return this.form === 'shikai' ? 'Shikai — Benihime' : 'Urahara Shop';
  }

  ai(): KitAI {
    const sealed = () => this.form === 'sealed', shikai = () => this.form === 'shikai', bankai = () => this.form === 'bankai';
    return {
      reach: 1.7,
      chain: 4,
      releaseAt: [0.75, 0.4],
      moves: [
        { name: 'pin', use: () => this.heavy(), min: 0, max: 2.8, weight: 1.2, cd: 3, when: sealed },
        { name: 'shibire', use: () => this.skill1(), min: 0, max: 4.5, weight: 1.6, cd: 5, when: sealed },
        { name: 'byakurai', use: () => this.skill2(), min: 5, max: 70, weight: 1.8, cd: 3.5, when: sealed },
        { name: 'bind', use: () => this.skill3(), min: 3, max: 18, weight: 1.4, cd: 6, when: sealed },
        { name: 'bind2', use: () => this.skill3(), min: 0, max: 20, weight: 8, cd: 0.6, when: () => sealed() && !!this.binding && !this.binding.done && this.bindLayer < 3 },
        { name: 'gigai', use: () => this.toggle(), min: 0, max: 6, weight: 0.8, cd: 9, when: sealed },
        { name: 'nake', use: () => this.heavy(), min: 3, max: 40, weight: 1.8, cd: 2.6, when: () => shikai() || (bankai() && !this.seams.size) },
        { name: 'shield', use: () => this.skill1(), min: 0, max: 5, weight: 0.8, cd: 4, when: shikai },
        { name: 'kamisori', use: () => this.skill2(), min: 4, max: 45, weight: 1.6, cd: 2.2, when: shikai },
        { name: 'shibari', use: () => this.skill3(), min: 3, max: 20, weight: 1.4, cd: 7, when: () => shikai() && !this.net },
        { name: 'hiasobi', use: () => this.skill3(), min: 0, max: 30, weight: 10, cd: 0.5, when: () => shikai() && !!this.net && this.net.caught && !this.net.lit },
        { name: 'tsuppane', use: () => this.toggle(), min: 4, max: 30, weight: 0.6, cd: 6, when: shikai },
        { name: 'open', use: () => this.heavy(), min: 0, max: 30, weight: 3, cd: 2, when: () => bankai() && [...this.seams.values()].some((n) => n >= 3) },
        { name: 'dismantle', use: () => this.skill1(), min: 2, max: 13, weight: 1.6, cd: 7, when: bankai },
        { name: 'rebuild', use: () => this.skill2(), min: 0, max: 60, weight: 2, cd: 12, when: () => bankai() && this.f.hp < this.f.maxHp * 0.6 },
        { name: 'rail', use: () => this.skill3(), min: 5, max: 28, weight: 1.4, cd: 3, when: bankai },
        { name: 'kannon', use: () => this.toggle(), min: 2, max: 15, weight: 1.4, cd: 14, when: bankai },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const fm = this.form, cd = this.cd;
    const list: AbilityInfo[] = [{ key: 'LMB', name: fm === 'sealed' ? 'Cane' : 'Benihime', kanji: fm === 'sealed' ? '杖' : '紅姫' }];
    if (fm === 'sealed') {
      const layer = this.binding && !this.binding.done ? this.bindLayer : 0;
      list.push(
        { key: 'RMB', name: 'Shitonegaeshi', kanji: '褥返', cost: 6, cd: cd.heavy, cdMax: 2 },
        { key: 'Q', name: 'Shibireyubi', kanji: '痺指', cost: 10, cd: cd.shibire, cdMax: 5 },
        { key: 'E', name: 'Jūgeki Byakurai', kanji: '重撃白雷', cost: 16, cd: cd.byakurai, cdMax: 3.5 },
        { key: 'R', name: layer === 0 ? 'Rikujōkōrō' : layer === 1 ? 'Sajō Sabaku' : 'Kuyō Shibari', kanji: '縛道', cost: 10 + layer * 6, cd: cd.bind, cdMax: 8, active: layer > 0, tint: '#f2d23c' },
        { key: 'G', name: 'Portable Gigai', kanji: '義骸', cost: 12, cd: cd.gigai, cdMax: 8, active: this.gigaiT > 0, timer: this.gigaiT / 3 },
      );
    } else if (fm === 'shikai') {
      const lit = !!this.net && this.net.caught && !this.net.lit;
      list.push(
        { key: 'RMB', name: 'Nake', kanji: '啼け', cost: 16, cd: cd.nake, cdMax: 2.4 },
        { key: 'Q', name: 'Chikasumi no Tate', kanji: '血霞盾', cost: 10, cd: cd.shield, cdMax: 3 },
        { key: 'E', name: 'Kamisori', kanji: '剃刀', cost: 12, cd: cd.kamisori, cdMax: 2 },
        { key: 'R', name: lit ? 'Hiasobi · Juzutsunagi' : 'Shibari', kanji: lit ? '火遊' : '縛り', cost: lit ? 28 : 14, cd: cd.shibari, cdMax: 9, active: lit, tint: '#f37436' },
        { key: 'G', name: 'Tsuppane', kanji: '突ッ撥', cost: 14, cd: cd.tsuppane, cdMax: 5 },
      );
    } else {
      list.push(
        { key: 'RMB', name: this.seams.size ? 'Open' : 'Nake', kanji: this.seams.size ? '開' : '啼け', cost: this.seams.size ? 12 : 18, cd: this.seams.size ? cd.heavy : cd.nake, cdMax: 2.4, active: this.seams.size > 0 },
        { key: 'Q', name: 'Dismantle', kanji: '改メ', cost: 24, cd: cd.dismantle, cdMax: 7 },
        { key: 'E', name: 'Self-restructure', kanji: '再構', cost: 20, cd: cd.rebuild, cdMax: 12 },
        { key: 'R', name: 'Stitch rail', kanji: '縫', cost: 12, cd: cd.rail, cdMax: 3 },
        { key: 'G', name: 'Kannonbiraki', kanji: '観音開', cost: 40, cd: cd.kannon, cdMax: 14 },
      );
    }
    list.push(
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      fm === 'bankai' ? { key: 'F', name: 'Kannonbiraki', kanji: '卍解', active: true, timer: this.bankaiT / BANKAI_TIME, tint: '#ffd6dc' } : { key: 'F', name: fm === 'sealed' ? 'Okiro, Benihime' : 'Bankai', kanji: fm === 'sealed' ? '起きろ' : '卍解', cost: fm === 'sealed' ? 20 : 60, tint: '#d01e3c' },
    );
    return list;
  }
}

export { TEX_STREAK };
