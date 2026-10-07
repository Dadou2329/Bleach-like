// Yamamoto's kit (docs/roster/B1-captains-1.md §2, Kit proposal). Sealed, robed and stooped on his cane: a
// slow, heavy cane string; Onibi (RMB: a thrust with the blunt cane that punches a hole clean through the
// target and the wall behind); Hitotsume: Nadegiri (Q: one drawn cut too fast to see — a moment later
// everything in a line twenty metres long falls apart); Ikkotsu (E: one punch that sends the target down
// the street through buildings); Sōkotsu (R: both fists, and the body shatters). G strips him for battle:
// the haori and the top of the shihakushō thrown off, a bare-fisted string with super armour. F: "Banshō
// issai kaijin to nase, Ryūjin Jakka" — the cane peels away, the sky catches fire: burning cuts that set the
// world alight, the fire wave (RMB), Taimatsu (Q: the inferno), Jōkaku Enjō (E: the dome of fire that holds
// the target), Ennetsu Jigoku (R: pillars of fire round the area merging into one hell), Hadō #96 Ittō Kasō
// (G: a hand clamped on the enemy and the sword-tip pillar of fire; it costs him). F again: Bankai, Zanka no
// Tachi — every flame on the field goes out into the blade, the clouds burn away: East (every cut erases what
// it touches; RMB taps the ground and a trench simply stops existing), South (Q: the charred dead rise and
// swarm the target), North (E: Tenchi Kaijin, a wave of fire that turns everything to ash), West (R: the
// hidden heat made visible — nothing can touch him). The heat burns him too; when it ends, it rains.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { CANE_TIP_Z, KATANA_TIP_Z, yamamotoAsset, yamamotoProp, type YamamotoForm } from '../../chars/yamamoto';
import { RYUJIN_CHAIN, RYUJIN_STANCE, YAMAMOTO_BARE_CHAIN, YAMAMOTO_BARE_STANCE, YAMAMOTO_CHAIN, YAMAMOTO_CLIPS, YAMAMOTO_STANCE } from '../../chars/yamamotoClips';
import { FIRE_DARK, FireDome, FirePillars, FireWave, FlamePool, Inferno, IttoKaso, Rain, SKY_FIRE, SKY_RAIN, SKY_SCORCHED, SkeletonHorde, SkyTint, burnAt, eraseTrench, heatHaze } from '../../vfx/fire';
import { BoxShape, CapsuleShape, ConeShape, SphereShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_PUFF } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

export const AURA_YAMAMOTO: AuraStyle = { core: '#FFF4C2', body: '#FF8A2A', rim: '#C4260B' };
export const AURA_ZANKA: AuraStyle = { core: '#FFF6D8', body: '#FF9A3C', rim: '#5A1808', dark: '#231C19' };

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE_CANE: BladeDef = { prop: 'sword', base: [0, 0, 0.06], tip: [0, 0, CANE_TIP_Z], color: '#9C7448', core: '#F3F3F0' };
const BLADE_RYUJIN: BladeDef = { prop: 'sword', base: [0, 0, 0.08], tip: [0, 0, KATANA_TIP_Z], color: '#FF6A12', core: '#FFF4C2' };
const BLADE_ZANKA: BladeDef = { prop: 'sword', base: [0, 0, 0.08], tip: [0, 0, KATANA_TIP_Z], color: '#FF5A1A', core: '#FFF1C9' };

const BANKAI_TIME = 30;

export const YAMAMOTO_DEF: FighterDef = {
  id: 'yamamoto',
  name: 'Genryūsai Shigekuni Yamamoto',
  title: 'Captain-Commander',
  build: () => ({ asset: yamamotoAsset('robed'), props: [{ key: 'sword', model: yamamotoProp('cane'), socket: 'grip.R' }] }),
  stance: YAMAMOTO_STANCE,
  clips: YAMAMOTO_CLIPS,
  aura: AURA_YAMAMOTO,
  blade: BLADE_CANE,
  hp: 1500,
  rei: 200,
  speed: { run: 10, sprint: 30, jump: 13, dash: 26, dashTime: 0.1 },
  radius: 0.4,
  height: 1.68,
};

type Form = 'sealed' | 'shikai' | 'bankai';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

interface MoveInfo {
  lunge: number;
  window?: [number, number];
  trail?: [number, number];
  spec?: BladeSpec;
  strike?: { damage: number; knock: number; launch?: number; heavy?: boolean; reach: number; height: number; radius: number; hand: 'L' | 'R' };
}

const MOVES: Record<string, MoveInfo> = {
  ym_sweep: { lunge: 4, window: [0.16, 0.3], trail: [0.12, 0.34], spec: { damage: 20, knock: 12, launch: 0, hitstop: 0.07, shake: 0.18, cut: 160 } },
  ym_thrust: { lunge: 5, strike: { damage: 22, knock: 16, reach: 1.4, height: 1.2, radius: 0.8, hand: 'R' } },
  ym_over: { lunge: 4, window: [0.2, 0.34], trail: [0.16, 0.38], spec: { damage: 24, knock: 8, launch: 0, heavy: true, hitstop: 0.08, shake: 0.24, cut: 200 } },
  ym_spin: { lunge: 4, window: [0.24, 0.42], trail: [0.2, 0.46], spec: { damage: 26, knock: 18, launch: 3, heavy: true, hitstop: 0.09, shake: 0.28, cut: 220 } },
  ym_jab: { lunge: 6, strike: { damage: 18, knock: 8, reach: 1.15, height: 1.3, radius: 0.8, hand: 'L' } },
  ym_hook: { lunge: 6, strike: { damage: 22, knock: 12, reach: 1.0, height: 1.3, radius: 0.95, hand: 'R' } },
  ym_knee: { lunge: 6, strike: { damage: 22, knock: 4, launch: 9, reach: 0.7, height: 1.0, radius: 0.85, hand: 'R' } },
  ym_ikkotsu_bare: { lunge: 9, strike: { damage: 36, knock: 26, launch: 3, heavy: true, reach: 1.2, height: 1.2, radius: 1.0, hand: 'L' } },
  ym_k1: { lunge: 6, window: [0.1, 0.22], trail: [0.08, 0.28], spec: { damage: 26, knock: 10, launch: 0, hitstop: 0.06, shake: 0.18, cut: 600 } },
  ym_k2: { lunge: 6, window: [0.1, 0.22], trail: [0.08, 0.28], spec: { damage: 26, knock: 10, launch: 4, hitstop: 0.06, shake: 0.18, cut: 600 } },
  ym_k3: { lunge: 6, window: [0.16, 0.3], trail: [0.12, 0.34], spec: { damage: 30, knock: 8, launch: 0, heavy: true, hitstop: 0.08, shake: 0.24, cut: 650 } },
  ym_k4: { lunge: 6, window: [0.22, 0.42], trail: [0.18, 0.46], spec: { damage: 38, knock: 18, launch: 5, heavy: true, hitstop: 0.1, shake: 0.32, cut: 900 } },
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

  constructor(readonly kit: YamamotoKit, readonly clip: string, readonly index: number) {
    super();
    this.name = clip;
    this.info = MOVES[clip] ?? { lunge: 4 };
    this.mobility = 0.1;
    this.airGravity = 0.1;
    // he does not stop for a light blow
    this.armor = kit.stripped ? 0.4 : 0.2;
  }

  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    const speed = this.kit.form === 'bankai' ? 0.8 : 1;
    this.dur = (c.dur - c.fadeOut * 0.5) / speed;
    this.comboAt = (c.events.combo ?? c.dur * 0.6) / speed;
    this.hitAt = (c.events.hit ?? c.dur * 0.4) / speed;
    f.bladeHits.clear();
    f.bladeSpec = this.info.spec ?? null;
    f.anim.play(this.clip, {
      speed,
      onEvent: (n) => {
        if (n !== 'step') return;
        const tgt = f.faceTarget;
        const extra = tgt ? Math.min(4, Math.max(0, f.pos.distanceTo(tgt) - 1.7)) : 0;
        f.push.addScaledVector(f.forward(), this.info.lunge + extra * 2);
        g.sfx.play('swingHeavy', f.center(), 0.7);
      },
    });
  }

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t, info = this.info;
    if (info.window) {
      const speed = this.kit.form === 'bankai' ? 0.8 : 1;
      f.bladeActive = t >= info.window[0] / speed && t <= info.window[1] / speed;
      if (f.trail && info.trail) f.trail.emitting = t >= info.trail[0] / speed && t <= info.trail[1] / speed;
      if (f.bladeActive && f.bladeValid) this.kit.edge(f.blade.base, f.blade.tip, dt);
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
        g.damage(o, s.damage, f, dir.clone(), { knock: s.knock, launch: s.launch, heavy: s.heavy, hitstop: 0.07, shake: 0.24 });
        g.sparks(new THREE.Vector3(o.pos.x, cy, o.pos.z), dir, '#FFD39A', 10);
      }
      if (this.kit.stripped) {
        // his fists alone break walls
        const k = sock(f, s.hand === 'L' ? 'knuckle.L' : 'knuckle.R');
        g.engine.destruction.carve(new ConeShape(k.clone(), fw.clone(), 0.4, 3), { mode: 'smash', power: 180, impulse: 10, dust: 0.4 });
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
  constructor(readonly kit: YamamotoKit) {
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
}

/** RMB (sealed): Onibi — the blunt cane driven through the target and the wall behind it. */
class OnibiAction extends SkillAction {
  readonly name = 'onibi';
  constructor(kit: YamamotoKit) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ym_onibi', (n) => {
      if (n === 'charge') g.sfx.play('charge', f.center(), 0.6);
      if (n === 'step') f.push.addScaledVector(f.forward(), 10);
      if (n !== 'hit') return;
      const fw = f.forward(_w).clone();
      const from = f.center().addScaledVector(fw, 0.7);
      const to = from.clone().addScaledVector(fw, 9);
      g.engine.destruction.carve(new CapsuleShape(from, to, 0.85), { mode: 'bore', power: 700, dir: fw, sparks: [1, 0.8, 0.5], dust: 0.6 });
      for (const o of g.enemiesOf(f)) {
        const d = _v.subVectors(o.center(), from);
        const along = d.dot(fw);
        if (along < -0.5 || along > 9) continue;
        if (d.addScaledVector(fw, -along).length() > 1 + o.def.radius) continue;
        g.damage(o, 64, f, fw.clone(), { knock: 22, launch: 2, heavy: true, hitstop: 0.14, shake: 0.5 });
      }
      g.callout('鬼火', 'ONIBI', '#ffd39a');
      g.sfx.play('impact', from, 1.4);
    });
  }
}

/** Q (sealed): Hitotsume: Nadegiri — the cut is never seen; a moment later, everything along it falls apart. */
class NadegiriAction extends SkillAction {
  readonly name = 'nadegiri';
  private cut = false;
  private landAt = -1;
  private from = new THREE.Vector3();
  private dir = new THREE.Vector3();
  constructor(kit: YamamotoKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ym_nadegiri', (n) => {
      if (n === 'hit' && !this.cut) {
        this.cut = true;
        this.from.copy(f.center());
        this.dir.copy(aim(f, g)).sub(this.from).setY(0).normalize();
        this.landAt = this.t + 0.4;
        g.sfx.play('swing', f.center(), 1.2);
        g.engine.glow.spawn({ x: this.from.x, y: this.from.y, z: this.from.z, size: 2, sizeEnd: 0.4, life: 0.08, r: 1, g: 1, b: 0.95, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.landAt < 0 || this.t < this.landAt) return;
    this.landAt = -1;
    // the line the cut went along: a thin slice 20 m long, standing tall
    const len = 22;
    const mid = this.from.clone().addScaledVector(this.dir, len / 2);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.dir);
    // tilt the slice like the cut
    q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.35));
    g.engine.destruction.carve(new BoxShape(mid, new THREE.Vector3(0.12, 9, len / 2), q), { mode: 'cut', power: 1500, dir: new THREE.Vector3(0, -1, 0), sparks: [1, 0.95, 0.85], dust: 0.6 });
    for (const o of g.enemiesOf(f)) {
      const d = _v.subVectors(o.center(), this.from);
      const along = d.dot(this.dir);
      if (along < 0 || along > len) continue;
      if (d.addScaledVector(this.dir, -along).length() > 1.2 + o.def.radius) continue;
      g.damage(o, 110, f, this.dir.clone(), { knock: 6, launch: 3, heavy: true, hitstop: 0.18, shake: 0.6, color: '#FFFFFF' });
    }
    g.callout('一ツ目・撫斬', 'HITOTSUME — NADEGIRI', '#f3f3f0');
    g.slowMo(0.2, 0.4);
  }
}

/** E / R (sealed or stripped): Ikkotsu — one punch; Sōkotsu — both fists. */
class FistAction extends SkillAction {
  readonly name: string;
  private hits = new Set<number>();
  constructor(kit: YamamotoKit, readonly double: boolean) {
    super(kit);
    this.name = double ? 'sokotsu' : 'ikkotsu';
    this.mobility = 0.05;
    this.armor = 0.6;
  }
  override start(f: Fighter, g: Game): void {
    const clip = this.double ? 'ym_sokotsu' : this.kit.stripped ? 'ym_ikkotsu_bare' : 'ym_ikkotsu';
    this.kit.fists(true);
    this.playClip(f, clip, (n) => {
      if (n === 'charge') g.sfx.play('charge', f.center(), 0.7);
      if (n === 'step') {
        f.push.addScaledVector(f.forward(), 12);
        g.sfx.play('swingHeavy', f.center(), 1.3);
      }
      if (n !== 'hit') return;
      const fw = f.forward(_w).clone();
      const p = f.pos.clone().addScaledVector(fw, 1.2).setY(f.pos.y + 1.2);
      for (const o of g.enemiesOf(f)) {
        if (this.hits.has(o.id)) continue;
        const cy = Math.max(o.pos.y + 0.1, Math.min(o.pos.y + o.def.height - 0.2, p.y));
        if (Math.hypot(o.pos.x - p.x, cy - p.y, o.pos.z - p.z) > 1.2 + o.def.radius) continue;
        this.hits.add(o.id);
        if (this.double) g.damage(o, 120, f, fw.clone(), { knock: 10, launch: 6, heavy: true, hitstop: 0.2, shake: 0.8 });
        else g.damage(o, 80, f, fw.clone(), { knock: 46, launch: 3, heavy: true, hitstop: 0.16, shake: 0.6 });
        g.sparks(o.center(), fw, '#FFD39A', 20);
      }
      const k = sock(f, 'knuckle.L');
      g.engine.destruction.carve(new ConeShape(k.clone(), fw, 0.6, this.double ? 6 : 9), { mode: 'smash', power: 420, impulse: 18, dust: 0.8 });
      if (this.double) g.engine.destruction.carve(new SphereShape(p.clone().addScaledVector(fw, 1), 2.4, 0.9), { mode: 'explode', power: 300, impulse: 16 });
      g.callout(this.double ? '双骨' : '一骨', this.double ? 'SŌKOTSU' : 'IKKOTSU', '#ffd39a');
      g.shake(f === g.player ? 0.5 : 0.2);
    });
  }
  override end(f: Fighter): void {
    super.end(f);
    if (!this.kit.stripped) this.kit.fists(false);
  }
}

/** G (sealed): strip for battle — the haori and the top thrown off; or put them back on. */
class StripAction extends SkillAction {
  readonly name = 'strip';
  constructor(kit: YamamotoKit) {
    super(kit);
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ym_strip', (n) => {
      if (n === 'throw') this.kit.setStripped(!this.kit.stripped);
    });
    g.sfx.play('swingHeavy', f.center(), 1);
  }
}

/** F: "Banshō issai kaijin to nase, Ryūjin Jakka." */
class ReleaseAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: YamamotoKit) {
    super(kit);
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ym_release', (n) => {
      if (n === 'peel') this.kit.peel();
      if (n === 'burst') this.kit.becomeShikai();
    });
    g.callout('万象一切灰燼と為せ', 'BANSHŌ ISSAI KAIJIN TO NASE', '#ffb23e');
  }
}

/** RMB (Shikai): the fire wave off a wide sweep / (Bankai) North, Tenchi Kaijin. */
class WaveAction extends SkillAction {
  readonly name = 'wave';
  constructor(kit: YamamotoKit, readonly north: boolean) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = { damage: 30, knock: 12, launch: 2, heavy: true, hitstop: 0.08, shake: 0.3, cut: 700 };
    this.playClip(f, 'ym_wave', (n) => {
      if (n === 'step') g.sfx.play('swingHeavy', f.center(), 1.2);
      if (n !== 'hit') return;
      const from = f.center().addScaledVector(f.forward(_w), 0.8);
      const dir = aim(f, g).sub(from);
      dir.y *= 0.3;
      dir.normalize();
      const side = new THREE.Vector3(-dir.z, 0, dir.x);
      g.addProjectile(new FireWave(g, f, from, dir, side, this.north, this.north ? FIRE_DARK : undefined));
      if (this.north) {
        g.callout('北・天地灰尽', 'KITA — TENCHI KAIJIN', '#fff1c9');
        g.shake(f === g.player ? 0.7 : 0.3);
        g.slowMo(0.25, 0.4);
      }
    }, this.north ? 0.8 : 1);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const s = this.north ? 0.8 : 1;
    f.bladeActive = this.t >= 0.24 / s && this.t <= 0.38 / s;
    if (f.trail) f.trail.emitting = this.t >= 0.2 / s && this.t <= 0.42 / s;
  }
}

/** Q (Shikai): Taimatsu — one wave of the sword, and an inferno in front of him. */
class TaimatsuAction extends SkillAction {
  readonly name = 'taimatsu';
  constructor(kit: YamamotoKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ym_taimatsu', (n) => {
      if (n !== 'fire') return;
      const dir = aim(f, g).sub(f.pos).setY(0).normalize();
      g.addProjectile(new Inferno(g, f, f.pos.clone().addScaledVector(dir, 1), dir, 18, 0.55, 1.6, 90));
      g.callout('松明', 'TAIMATSU', '#ffb23e');
    });
  }
}

/** E (Shikai): Jōkaku Enjō — the wall of fire rings the target and closes over it. */
class JokakuAction extends SkillAction {
  readonly name = 'jokaku';
  constructor(kit: YamamotoKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ym_jokaku', (n) => {
      if (n !== 'call' || this.target.dead) return;
      g.addProjectile(new FireDome(g, f, this.target, 6.5, 5.5, 30));
      g.callout('城郭炎上', 'JŌKAKU ENJŌ', '#ffb23e');
    });
  }
}

/** R (Shikai): Ennetsu Jigoku — the sword in the ground, the fire run out, the pillars. */
class EnnetsuAction extends SkillAction {
  readonly name = 'ennetsu';
  constructor(kit: YamamotoKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ym_ennetsu', (n) => {
      if (n === 'plant') {
        const tip = f.pos.clone().addScaledVector(f.forward(_w), 0.8);
        burnAt(g, tip, 1, 1.4, 1.6);
        g.sfx.play('impact', tip, 1);
      }
      if (n !== 'rise') return;
      const c = this.target && !this.target.dead ? this.target.pos.clone() : f.pos.clone().addScaledVector(f.forward(_w), 8);
      g.addProjectile(new FirePillars(g, f, c, 12, 8, 4.6, 240));
      g.callout('焱熱地獄', 'ENNETSU JIGOKU', '#ff6a12');
    });
  }
}

/** G (Shikai): Hadō #96 Ittō Kasō — the left hand clamped on the enemy; the sword-tip pillar of fire. */
class IttoAction extends SkillAction {
  readonly name = 'itto';
  private held: Fighter | null = null;
  constructor(kit: YamamotoKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.7;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ym_itto', (n) => {
      if (n === 'step') f.push.addScaledVector(f.forward(), 12);
      if (n === 'grab' && !this.target.dead && this.target.pos.distanceTo(f.pos) < 3.2) {
        this.held = this.target;
        g.sfx.play('hit', this.target.center(), 1);
      }
      if (n !== 'cast') return;
      const at = this.held ? this.held.pos.clone() : f.pos.clone().addScaledVector(f.forward(_w), 2);
      g.addProjectile(new IttoKaso(g, f, at, this.held ? 260 : 200));
      g.callout('破道の九十六 一刀火葬', 'HADŌ #96 — ITTŌ KASŌ', '#e3260f');
      // the sacrifice: it burns part of his own body
      f.hp = Math.max(1, f.hp - f.maxHp * 0.12);
      f.flashT = 0.3;
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const o = this.held;
    if (o && !o.dead && this.t < 0.75) {
      o.body.vel.set(0, Math.min(0, o.body.vel.y), 0);
      o.push.set(0, 0, 0);
      o.hitstun = Math.max(o.hitstun, 0.3);
    }
  }
}

/** F again: Bankai — the flames go out into the blade. */
class BankaiAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: YamamotoKit) {
    super(kit);
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    g.callout('卍解', 'BANKAI', '#fff1c9');
    this.playClip(f, 'ym_bankai', (n) => {
      if (n === 'recall') this.kit.becomeBankai();
      if (n === 'done') g.callout('残火の太刀', 'ZANKA NO TACHI', '#fff1c9');
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // every flame flies into the blade
    if (this.t > 0.4 && this.t < 1.5) {
      const tip = f.bladeValid ? f.blade.tip : f.center();
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 20;
        const p = new THREE.Vector3(f.pos.x + Math.cos(a) * r, f.pos.y + Math.random() * 6, f.pos.z + Math.sin(a) * r);
        const life = 0.4;
        g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (tip.x - p.x) / life, vy: (tip.y - p.y) / life, vz: (tip.z - p.z) / life, size: 0.5, sizeEnd: 0.1, life, r: 1, g: 0.55, b: 0.15, alpha: 0.9, alphaEnd: 0.3, tex: TEX_GLOW });
      }
    }
  }
}

/** Bankai RMB: the tip touched to the ground — a trench in front of him simply stops existing. */
class TapAction extends SkillAction {
  readonly name = 'tap';
  constructor(kit: YamamotoKit) {
    super(kit);
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ym_tap', (n) => {
      if (n !== 'tap') return;
      const dir = aim(f, g).sub(f.pos).setY(0).normalize();
      eraseTrench(g, f, f.pos.clone().addScaledVector(dir, 1.2), dir, 34, 2.4, 6, 90);
      g.callout('東・旭日刃', 'HIGASHI — KYOKUJITSUJIN', '#fff1c9');
      g.shake(f === g.player ? 0.4 : 0.15);
    });
  }
}

/** Bankai Q: South — the sword driven into the ground and the dead rise. */
class MinamiAction extends SkillAction {
  readonly name = 'minami';
  constructor(kit: YamamotoKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ym_minami', (n) => {
      if (n !== 'rise' || this.target.dead) return;
      g.addProjectile(new SkeletonHorde(g, f, this.target, 26, 5.5, 10));
      g.callout('南・火火十万億死大葬陣', 'MINAMI — KAKA JŪMAN\'OKUSHI DAISŌJIN', '#ffb040');
    });
  }
}

/** Bankai R: West — the hidden flames made visible round him; nothing that touches him survives it. */
class WestAction extends SkillAction {
  readonly name = 'west';
  constructor(kit: YamamotoKit) {
    super(kit);
    this.mobility = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'ym_bankai', () => {}, 2);
    this.dur = 0.6;
    this.kit.westT = 5;
    g.callout('西・残日獄衣', 'NISHI — ZANJITSU GOKUI', '#fff6d8');
    const c = f.center();
    for (const o of g.enemiesOf(f)) {
      if (o.pos.distanceTo(f.pos) > 4) continue;
      g.damage(o, 40, f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 22, launch: 4, heavy: true, hitstop: 0.1, shake: 0.4, color: '#FFF6D8' });
    }
    g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 3, sizeEnd: 9, life: 0.3, r: 1, g: 0.9, b: 0.65, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    burnAt(g, f.pos.clone(), 4, 1.6, 1.8);
    g.sfx.play('explode', c, 1.4);
  }
}

// ------------------------------------------------------------------ the kit

export class YamamotoKit implements Kit {
  form: Form = 'sealed';
  stripped = false;
  flare = false;
  comboIndex = 0;
  bankaiT = 0;
  /** West made visible for this long */
  westT = 0;
  private sky: SkyTint | null = null;
  /** after the Bankai: the rain sky, and how long until it clears */
  private rainSky: { sky: SkyTint; t: number } | null = null;
  private lastEnd = 0;
  private hazeAcc = 0;
  private edgeAcc = 0;
  private cd = { heavy: 0, nadegiri: 0, ikkotsu: 0, sokotsu: 0, strip: 0, wave: 0, taimatsu: 0, jokaku: 0, ennetsu: 0, itto: 0, tap: 0, minami: 0, kita: 0, west: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    this.fists(false);
    this.applyStats();
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    if (f.dead && this.sky) this.sky.target = 0;
    if (this.rainSky && (this.rainSky.t -= dt) <= 0) {
      this.rainSky.sky.target = 0;
      this.rainSky = null;
    }
    if (this.form === 'shikai' && !f.dead) {
      // the flames coil round him
      this.hazeAcc += dt;
      if (this.hazeAcc > 0.08) {
        this.hazeAcc = 0;
        const pool = FlamePool.of(g);
        const a = Math.random() * Math.PI * 2;
        pool.spawn(f.pos.x + Math.cos(a) * 0.7, f.pos.y, f.pos.z + Math.sin(a) * 0.7, 0.6, 1.2 + Math.random() * 0.8, 0.6, 0.9);
      }
    }
    if (this.form === 'bankai' && !f.dead) {
      this.bankaiT -= dt;
      this.westT = Math.max(0, this.westT - dt);
      this.hazeAcc += dt;
      if (this.hazeAcc > 0.1) {
        this.hazeAcc = 0;
        heatHaze(g, f, this.westT > 0);
      }
      // West: whoever stands against him burns away
      if (this.westT > 0) {
        for (const o of g.enemiesOf(f)) {
          if (o.pos.distanceTo(f.pos) > 1.8 + o.def.radius) continue;
          g.damage(o, 60 * dt, f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 2, quiet: true, color: '#FFF6D8' });
        }
      }
      // the heat that dries the world burns him too, more as it goes on
      if (this.bankaiT < BANKAI_TIME - 18) f.hp = Math.max(1, f.hp - f.maxHp * 0.006 * dt * (1 + (BANKAI_TIME - 18 - this.bankaiT) * 0.2));
      if (this.bankaiT <= 0 && !f.busy) this.endBankai();
    }
  }

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 80, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 80);
  }

  private near(range: number): Fighter | null {
    const t = this.target();
    return t && t.pos.distanceTo(this.f.pos) <= range ? t : null;
  }

  /** fists for the punches (and while stripped), open hands otherwise */
  fists(on: boolean): void {
    const rig = this.f.visual.rig;
    rig.setBoneVisible('fist.R', true);
    rig.setBoneVisible('palm.R', false);
    rig.setBoneVisible('fist.L', on);
    rig.setBoneVisible('palm.L', !on);
  }

  /** the blade's edge passing through the world this step: Shikai burns, Bankai erases */
  edge(base: THREE.Vector3, tip: THREE.Vector3, dt: number): void {
    const g = this.g;
    if (this.form === 'sealed') return;
    this.edgeAcc += dt;
    if (this.edgeAcc < 0.04) return;
    this.edgeAcc = 0;
    if (this.form === 'shikai') burnAt(g, tip.clone(), 0.9, 1.1, 1.0);
    else g.engine.destruction.carve(new CapsuleShape(base.clone(), tip.clone().addScaledVector(tip.clone().sub(base).normalize(), 0.6), 0.35), { mode: 'erase', power: 1e6, dust: 0 });
  }

  onHit(o: Fighter): void {
    const g = this.g;
    if (this.form === 'shikai' && !o.dead) {
      // the cut sets the target alight
      burnAt(g, o.pos.clone(), 0.8, 1, 1.2);
      g.damage(o, 8, this.f, new THREE.Vector3(), { knock: 0, quiet: true, color: '#FF8A2A' });
    }
  }

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof StringAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.9) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.form !== 'sealed' ? RYUJIN_CHAIN : this.stripped ? YAMAMOTO_BARE_CHAIN : YAMAMOTO_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.9;
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

  /** RMB: Onibi / the fire wave / the tap. */
  heavy(): void {
    const f = this.f;
    if (f.busy && !(f.action instanceof StringAction)) return;
    if (this.form === 'sealed') this.special(new OnibiAction(this), 10, 'heavy', 2.6);
    else if (this.form === 'shikai') this.special(new WaveAction(this, false), 16, 'wave', 2.4);
    else this.special(new TapAction(this), 20, 'tap', 4);
  }

  /** Q: Nadegiri / Taimatsu / South. */
  skill1(): void {
    if (this.form === 'sealed') this.special(new NadegiriAction(this), 18, 'nadegiri', 6);
    else if (this.form === 'shikai') this.special(new TaimatsuAction(this), 26, 'taimatsu', 7);
    else {
      const t = this.near(30);
      if (t) this.special(new MinamiAction(this, t), 34, 'minami', 12);
    }
  }

  /** E: Ikkotsu / Jōkaku Enjō / North. */
  skill2(): void {
    if (this.form === 'sealed') this.special(new FistAction(this, false), 12, 'ikkotsu', 4);
    else if (this.form === 'shikai') {
      const t = this.near(30);
      if (t) this.special(new JokakuAction(this, t), 30, 'jokaku', 12);
    } else this.special(new WaveAction(this, true), 40, 'kita', 10);
  }

  /** R: Sōkotsu / Ennetsu Jigoku / West. */
  skill3(): void {
    if (this.form === 'sealed') this.special(new FistAction(this, true), 18, 'sokotsu', 7);
    else if (this.form === 'shikai') this.special(new EnnetsuAction(this, this.near(40)), 45, 'ennetsu', 16);
    else this.special(new WestAction(this), 26, 'west', 10);
  }

  /** G: strip for battle / Ittō Kasō. */
  toggle(): void {
    if (this.form === 'sealed') this.special(new StripAction(this), 0, 'strip', 2);
    else if (this.form === 'shikai') {
      const t = this.near(6);
      if (t) this.special(new IttoAction(this, t), 50, 'itto', 18);
    }
  }

  release(): void {
    const f = this.f;
    if (this.form === 'bankai' || f.busy) return;
    if (!f.spendRei(this.form === 'sealed' ? 30 : 80)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(this.form === 'sealed' ? new ReleaseAction(this) : new BankaiAction(this), true);
  }

  toggleFlare(): void {
    this.flare = !this.flare;
    this.applyStats();
    if (this.flare) {
      const { f, g } = this;
      f.aura.flare(1.8, 0.5);
      g.shake(0.25);
      g.sfx.play('flare', f.center());
      // his reiatsu sets the ground round him alight
      if (this.form !== 'bankai') burnAt(g, f.pos.clone(), 2.4, 1.2, 1.4);
    }
  }

  private body(form: YamamotoForm): void {
    const f = this.f;
    const bare = this.stripped && this.form === 'sealed';
    const sword = this.form === 'sealed' ? 'cane' : this.form === 'bankai' ? 'bankai' : 'katana';
    // stripped for battle he fights bare-handed, the cane pushed through his belt
    const props = bare ? [{ key: 'cane', model: yamamotoProp('cane'), socket: 'hip.L' }] : [{ key: 'sword', model: yamamotoProp(sword), socket: 'grip.R' }];
    f.setForm({ asset: yamamotoAsset(form), props }, this.form === 'bankai' ? AURA_ZANKA : AURA_YAMAMOTO);
    this.fists(bare);
  }

  setStripped(on: boolean): void {
    const { f, g } = this;
    this.stripped = on;
    const stance = on && this.form === 'sealed' ? YAMAMOTO_BARE_STANCE : this.form === 'sealed' ? YAMAMOTO_STANCE : RYUJIN_STANCE;
    f.def = { ...f.def, stance };
    this.body(on ? 'stripped' : 'robed');
    if (on) {
      // the haori and the top thrown off
      const c = f.center();
      for (let i = 0; i < 18; i++) g.engine.dust.spawn({ x: c.x, y: c.y + 0.4, z: c.z, vx: (Math.random() - 0.5) * 6, vy: 2 + Math.random() * 3, vz: (Math.random() - 0.5) * 6, size: 0.2, sizeEnd: 0.1, life: 1, r: 0.95, g: 0.95, b: 0.93, alpha: 0.9, alphaEnd: 0, tex: TEX_PUFF, gravity: -6, drag: 1.2 });
      f.aura.flare(1.4, 0.6);
      g.sfx.play('flare', c, 0.8);
    }
    this.applyStats();
  }

  /** the cane peels away from the sword */
  peel(): void {
    const { f, g } = this;
    f.visual.detach('cane');
    f.visual.attach('sword', yamamotoProp('katana'), 'grip.R');
    const p = sock(f, 'grip.R');
    for (let i = 0; i < 20; i++) g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 3, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 3, size: 0.08, sizeEnd: 0.04, life: 0.9, r: 0.48, g: 0.34, b: 0.2, alpha: 0.9, alphaEnd: 0, tex: TEX_PUFF, gravity: -8 });
  }

  becomeShikai(): void {
    const { f, g } = this;
    if (this.form !== 'sealed') return;
    this.form = 'shikai';
    f.def = { ...f.def, stance: RYUJIN_STANCE, blade: BLADE_RYUJIN };
    f.anim.loco.stance = RYUJIN_STANCE;
    f.visual.detach('cane');
    f.visual.attach('sword', yamamotoProp('katana'), 'grip.R');
    f.trail?.setColor(BLADE_RYUJIN.color, BLADE_RYUJIN.core);
    f.bladeValid = false;
    this.fists(false);
    // the sky catches fire
    this.sky = new SkyTint(g, SKY_FIRE, 1.4);
    g.addProjectile(this.sky);
    f.aura.pillarBurst(2.4);
    f.aura.flare(2.2, 1);
    burnAt(g, f.pos.clone(), 5, 1.8, 2);
    g.addRing(f.pos.clone(), 18, '#FF8A2A', 0.6);
    g.sfx.play('bankai', f.center());
    g.shake(f === g.player ? 0.6 : 0.2);
    g.callout('流刃若火', 'RYŪJIN JAKKA', '#ffb23e');
    this.applyStats();
  }

  becomeBankai(): void {
    const { f, g } = this;
    if (this.form !== 'shikai') return;
    this.form = 'bankai';
    this.bankaiT = BANKAI_TIME;
    this.stripped = false;
    f.def = { ...f.def, blade: BLADE_ZANKA };
    this.body('tybw');
    f.anim.loco.stance = RYUJIN_STANCE;
    f.trail?.setColor(BLADE_ZANKA.color, BLADE_ZANKA.core);
    f.bladeValid = false;
    // every flame on the field goes out at once; the sky clears and bakes
    const d = g as unknown as { flamePool?: FlamePool };
    if (d.flamePool) {
      d.flamePool.done = true;
      d.flamePool = undefined;
    }
    if (this.sky) this.sky.look = SKY_SCORCHED;
    else {
      this.sky = new SkyTint(g, SKY_SCORCHED, 1.4);
      g.addProjectile(this.sky);
    }
    f.aura.flare(1.6, 0.8);
    g.sfx.play('bankai', f.center());
    g.shake(f === g.player ? 0.5 : 0.2);
    g.slowMo(0.4, 0.4);
    g.engine.gr.chroma.offset.set(0.005, 0.005);
    this.applyStats();
  }

  private endBankai(): void {
    const { f, g } = this;
    this.form = 'shikai';
    this.westT = 0;
    f.def = { ...f.def, blade: BLADE_RYUJIN };
    this.body('robed');
    f.anim.loco.stance = RYUJIN_STANCE;
    f.visual.attach('sword', yamamotoProp('katana'), 'grip.R');
    f.trail?.setColor(BLADE_RYUJIN.color, BLADE_RYUJIN.core);
    f.bladeValid = false;
    // the water that was burnt off comes back as rain
    if (this.sky) this.sky.look = SKY_RAIN;
    g.addProjectile(new Rain(g, 9));
    if (this.sky) this.rainSky = { sky: this.sky, t: 9 };
    this.sky = null;
    if (f === g.player) g.hud?.showBanner('The heat breaks — it begins to rain');
    this.cd.kita = this.cd.minami = 20;
    this.applyStats();
  }

  private applyStats(): void {
    const f = this.f;
    const fm = this.form;
    f.power = (fm === 'bankai' ? 1.7 : fm === 'shikai' ? 1.35 : this.stripped ? 1.15 : 1) * (this.flare ? 1.25 : 1);
    f.damageTaken = fm === 'bankai' ? 0.7 : this.stripped ? 0.8 : 0.85;
    f.toughness = fm === 'bankai' ? 16 : this.stripped ? 12 : 8;
    f.aura.target = this.flare ? 1 : fm === 'bankai' ? 0.3 : fm === 'shikai' ? 0.55 : 0.08;
  }

  formName(): string {
    if (this.form === 'bankai') return `Bankai — Zanka no Tachi · ${Math.max(0, Math.ceil(this.bankaiT))} s`;
    if (this.form === 'shikai') return 'Shikai — Ryūjin Jakka';
    return this.stripped ? 'Captain-Commander — stripped for battle' : 'Captain-Commander';
  }

  ai(): KitAI {
    const sealed = () => this.form === 'sealed', shikai = () => this.form === 'shikai', bankai = () => this.form === 'bankai';
    return {
      reach: 1.8,
      chain: 4,
      releaseAt: [0.75, 0.35],
      toggleAt: 0.9,
      toggleOn: () => this.form !== 'sealed' || this.stripped,
      moves: [
        { name: 'onibi', use: () => this.heavy(), min: 0, max: 3, weight: 1.4, cd: 3, when: sealed },
        { name: 'nadegiri', use: () => this.skill1(), min: 2, max: 18, weight: 1.6, cd: 6, when: sealed },
        { name: 'ikkotsu', use: () => this.skill2(), min: 0, max: 2.6, weight: 1.4, cd: 4, when: sealed },
        { name: 'sokotsu', use: () => this.skill3(), min: 0, max: 2.4, weight: 1.2, cd: 7, when: sealed },
        { name: 'wave', use: () => this.heavy(), min: 3, max: 50, weight: 1.8, cd: 2.6, when: shikai },
        { name: 'taimatsu', use: () => this.skill1(), min: 2, max: 16, weight: 1.6, cd: 7, when: shikai },
        { name: 'jokaku', use: () => this.skill2(), min: 4, max: 28, weight: 1.2, cd: 12, when: shikai },
        { name: 'ennetsu', use: () => this.skill3(), min: 6, max: 36, weight: 1.0, cd: 16, when: shikai },
        { name: 'itto', use: () => this.toggle(), min: 0, max: 5, weight: 0.8, cd: 18, when: () => shikai() && this.f.hp > this.f.maxHp * 0.3 },
        { name: 'tap', use: () => this.heavy(), min: 3, max: 32, weight: 1.6, cd: 4, when: bankai },
        { name: 'minami', use: () => this.skill1(), min: 4, max: 28, weight: 1.4, cd: 12, when: bankai },
        { name: 'kita', use: () => this.skill2(), min: 4, max: 60, weight: 1.6, cd: 10, when: bankai },
        { name: 'west', use: () => this.skill3(), min: 0, max: 4, weight: 1.4, cd: 10, when: bankai },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const fm = this.form, cd = this.cd;
    const list: AbilityInfo[] = [{ key: 'LMB', name: fm === 'sealed' ? (this.stripped ? 'Hakuda' : 'Cane') : 'Ryūjin Jakka', kanji: fm === 'sealed' ? (this.stripped ? '白打' : '杖') : '流刃' }];
    if (fm === 'sealed') {
      list.push(
        { key: 'RMB', name: 'Onibi', kanji: '鬼火', cost: 10, cd: cd.heavy, cdMax: 2.6 },
        { key: 'Q', name: 'Nadegiri', kanji: '撫斬', cost: 18, cd: cd.nadegiri, cdMax: 6 },
        { key: 'E', name: 'Ikkotsu', kanji: '一骨', cost: 12, cd: cd.ikkotsu, cdMax: 4 },
        { key: 'R', name: 'Sōkotsu', kanji: '双骨', cost: 18, cd: cd.sokotsu, cdMax: 7 },
        { key: 'G', name: this.stripped ? 'Robe' : 'Strip for battle', kanji: '脱', active: this.stripped },
      );
    } else if (fm === 'shikai') {
      list.push(
        { key: 'RMB', name: 'Fire wave', kanji: '火波', cost: 16, cd: cd.wave, cdMax: 2.4 },
        { key: 'Q', name: 'Taimatsu', kanji: '松明', cost: 26, cd: cd.taimatsu, cdMax: 7 },
        { key: 'E', name: 'Jōkaku Enjō', kanji: '城郭炎上', cost: 30, cd: cd.jokaku, cdMax: 12 },
        { key: 'R', name: 'Ennetsu Jigoku', kanji: '焱熱地獄', cost: 45, cd: cd.ennetsu, cdMax: 16 },
        { key: 'G', name: 'Ittō Kasō', kanji: '一刀火葬', cost: 50, cd: cd.itto, cdMax: 18, tint: '#e3260f' },
      );
    } else {
      list.push(
        { key: 'RMB', name: 'East — Kyokujitsujin', kanji: '旭日刃', cost: 20, cd: cd.tap, cdMax: 4 },
        { key: 'Q', name: 'South — the dead', kanji: '大葬陣', cost: 34, cd: cd.minami, cdMax: 12 },
        { key: 'E', name: 'North — Tenchi Kaijin', kanji: '天地灰尽', cost: 40, cd: cd.kita, cdMax: 10 },
        { key: 'R', name: 'West — Zanjitsu Gokui', kanji: '残日獄衣', cost: 26, cd: cd.west, cdMax: 10, active: this.westT > 0, timer: this.westT / 5 },
      );
    }
    list.push(
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      fm === 'bankai' ? { key: 'F', name: 'Zanka no Tachi', kanji: '卍解', active: true, timer: this.bankaiT / BANKAI_TIME, tint: '#fff1c9' } : { key: 'F', name: fm === 'sealed' ? 'Ryūjin Jakka' : 'Bankai', kanji: fm === 'sealed' ? '流刃若火' : '卍解', cost: fm === 'sealed' ? 30 : 80, tint: '#ffb23e' },
    );
    return list;
  }
}

