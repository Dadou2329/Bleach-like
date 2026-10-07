// Rukia's kit (docs/roster/A2-karakura-allies.md §1, Kit proposal). Sealed: a quick, turning katana string
// closed by a Hakuda kick, a lunging thrust, and her Kidō — Sōkatsui (Q; on a bound target the doubled Sōren
// Sōkatsui), Hainawa with Rikujōkōrō grown out of it (E), Byakurai (R). F: "Mae, Sode no Shirayuki" — the
// sword turns white and a long ribbon trails from the pommel; every cut leaves frost and three in a row freeze
// the target; the dances Tsukishiro (Q), Hakuren (E) and Shirafune (R); G: the white body — absolute zero for
// four seconds (whatever touches her freezes, nothing physical gets through), then a slow thaw. F again:
// Bankai, Hakka no Togame, for a short while: every cut freezes, the wave of absolute zero (Q), the mist
// pillar (E), an absolute-zero Shirafune (R); G thaws her out early. When it ends she thaws, slowly.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { BLADE_TIP_Z, POMMEL_Z, rukiaAsset, rukiaProp } from '../../chars/rukia';
import { RUKIA_CHAIN, RUKIA_CLIPS, RUKIA_STANCE, TOGAME_STANCE } from '../../chars/rukiaClips';
import { BlueFire, ColdWave, Hainawa, Rikujokoro, Tsukishiro } from '../../vfx/rukiaArts';
import { Ribbon } from '../../vfx/ribbon';
import { IcePrison, frostWorld, iceSpike, ICE_TINT } from '../../vfx/ice';
import { GlassShards } from '../../vfx/mirror';
import { groundAt } from '../../vfx/iceArts';
import { CeroBeam } from '../projectiles/cero';
import { PropMesh } from '../characterFactory';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

export const AURA_RUKIA: AuraStyle = { core: '#F3F3F0', body: '#BFE6F7', rim: '#6FA8D6' };
export const AURA_TOGAME: AuraStyle = { core: '#F3F3F0', body: '#C2DCEC', rim: '#8CB8D6' };
const FROST = '#BFE6F7';

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE_SEALED: BladeDef = { prop: 'sword', base: [0, 0, 0.06], tip: [0, 0.02, BLADE_TIP_Z], color: '#DCEBF5', core: '#F3F3F0' };
const BLADE_SHIKAI: BladeDef = { ...BLADE_SEALED, color: '#CFE3F2', core: '#F3F3F0' };
const BLADE_TOGAME: BladeDef = { ...BLADE_SEALED, color: '#8CB8D6', core: '#E6F4FA' };
/** how far Shirafune's ice blade reaches past the tip (m) */
const SHIRAFUNE_LEN = 3;

export const RUKIA_DEF: FighterDef = {
  id: 'rukia',
  name: 'Rukia Kuchiki',
  title: '13th Division',
  build: () => ({
    asset: rukiaAsset('shinigami'),
    props: [
      { key: 'sword', model: rukiaProp('katana'), socket: 'grip.R' },
      { key: 'sheath', model: rukiaProp('sheath-empty'), socket: 'hip.L' },
    ],
  }),
  stance: RUKIA_STANCE,
  clips: RUKIA_CLIPS,
  aura: AURA_RUKIA,
  blade: BLADE_SEALED,
  hp: 950,
  rei: 150,
  speed: { run: 10.5, sprint: 27, jump: 13, dash: 17, dashTime: 0.09 },
  radius: 0.3,
  height: 1.44,
};

const SPEED_THAW = { run: 6, sprint: 14, jump: 9, dash: 10, dashTime: 0.12 };

type Form = 'sealed' | 'shikai' | 'bankai';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

interface StrikeSpec {
  damage: number;
  knock: number;
  launch?: number;
  heavy?: boolean;
  reach: number;
  height: number;
  radius: number;
}

interface MoveInfo {
  lunge: number;
  window?: [number, number];
  trail?: [number, number];
  spec?: BladeSpec;
  strike?: StrikeSpec;
}

const MOVES: Record<string, MoveInfo> = {
  rk_cut1: { lunge: 7, window: [0.07, 0.19], trail: [0.05, 0.25], spec: { damage: 16, knock: 6, launch: 0, hitstop: 0.04, shake: 0.1, cut: 220 } },
  rk_cut2: { lunge: 7, window: [0.07, 0.19], trail: [0.05, 0.26], spec: { damage: 17, knock: 6, launch: 4, hitstop: 0.045, shake: 0.12, cut: 220 } },
  rk_cut3: { lunge: 6, window: [0.15, 0.3], trail: [0.12, 0.34], spec: { damage: 22, knock: 9, launch: 2, hitstop: 0.06, shake: 0.18, cut: 260 } },
  rk_kick: { lunge: 8, strike: { damage: 20, knock: 15, launch: 3, heavy: true, reach: 0.8, height: 0.35, radius: 0.95 } },
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

function bladeTip(f: Fighter): THREE.Vector3 {
  if (f.bladeValid && f.visual.props.has('sword')) return f.blade.tip.clone();
  return f.center().addScaledVector(f.forward(), 0.8);
}

function frostPuff(g: Game, p: THREE.Vector3, n = 8): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 1.6, vy: Math.random() * 1.2, vz: Math.sin(a) * 1.6, size: 0.25, sizeEnd: 0.9, life: 0.6, r: 0.9, g: 0.96, b: 1, alpha: 0.45, alphaEnd: 0, tex: TEX_PUFF, drag: 2.5 });
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 2.5, vy: Math.random() * 2.5, vz: Math.sin(a) * 2.5, size: 0.06, sizeEnd: 0.02, life: 0.45, r: 0.88, g: 0.97, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  }
}

// ------------------------------------------------------------------ the string

class StringAction extends FighterAction {
  readonly name: string;
  private info: MoveInfo;
  private dur = 0;
  private comboAt = 0;
  private hitAt = 0;
  private struck = false;
  private seen = new Set<number>();
  queued = false;

  constructor(readonly kit: RukiaKit, readonly clip: string, readonly index: number) {
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
    f.bladeSpec = this.info.spec ?? null;
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n !== 'step') return;
        const tgt = f.faceTarget;
        const extra = tgt ? Math.min(5, Math.max(0, f.pos.distanceTo(tgt) - 1.5)) : 0;
        f.push.addScaledVector(f.forward(), this.info.lunge + extra * 2.2);
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
      // frost where the white blade passes
      if (this.kit.form !== 'sealed' && f.bladeActive && Math.random() < 0.5) frostPuff(g, bladeTip(f), 1);
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
        g.damage(o, s.damage, f, dir.clone(), { knock: s.knock, launch: s.launch, heavy: s.heavy, hitstop: 0.07, shake: 0.25 });
        this.kit.onHit(o);
      }
      if (this.kit.form !== 'sealed') frostWorld(g, p.setY(f.pos.y + 0.2), 0.8, 200);
    }
    // every new blade hit chills (Shikai) or freezes (Bankai)
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
  constructor(readonly kit: RukiaKit) {
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

/** RMB: the lunging thrust — sealed: a plain thrust; Shikai: a spike of ice off the point; Bankai: a snowflake of ice blooms round the target. */
class ThrustAction extends SkillAction {
  readonly name = 'thrust';
  private fired = false;
  private seen = new Set<number>();
  constructor(kit: RukiaKit) {
    super(kit);
    this.mobility = 0.1;
    this.airGravity = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    const fm = this.kit.form;
    f.bladeSpec = { damage: fm === 'bankai' ? 34 : 26, knock: 10, launch: 1, heavy: true, hitstop: 0.08, shake: 0.28, cut: 320 };
    this.playClip(f, 'rk_thrust', (n) => {
      if (n === 'step') {
        f.push.addScaledVector(f.forward(), 12);
        g.sfx.play('swingHeavy', f.center(), 0.9);
      }
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    f.bladeActive = t >= 0.13 && t <= 0.3;
    if (f.trail) f.trail.emitting = t >= 0.1 && t <= 0.34;
    for (const id of f.bladeHits) {
      if (this.seen.has(id)) continue;
      this.seen.add(id);
      const o = g.fighters.find((x) => x.id === id);
      if (!o || o.dead) continue;
      if (this.kit.form === 'bankai') {
        // a snowflake of ice blooms where the point went in
        const c = o.center();
        const fw = f.forward(_w);
        const side = new THREE.Vector3(-fw.z, 0, fw.x);
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const d = side.clone().multiplyScalar(Math.cos(a)).add(new THREE.Vector3(0, Math.sin(a), 0));
          iceSpike(g, c.clone().addScaledVector(d, 0.3), d, 2.4, 0.32, 900);
        }
        g.addProjectile(new IcePrison(g, f, o, 1.4, 60, 'cross', 1));
        g.callout('白霞罸', 'HAKKA NO TOGAME', '#e6f4fa');
      } else this.kit.onHit(o);
    }
    if (!this.fired && t >= 0.2) {
      this.fired = true;
      if (this.kit.form === 'shikai') {
        const tip = bladeTip(f);
        iceSpike(g, tip, f.forward(), 2.2, 0.3, 700);
        frostPuff(g, tip, 10);
      }
    }
  }
}

// ------------------------------------------------------------------ Kidō

/** Q (sealed): Hadō #33 Sōkatsui — or, on a bound target, #73 Sōren Sōkatsui. */
class SokatsuiAction extends SkillAction {
  readonly name = 'sokatsui';
  constructor(kit: RukiaKit, readonly twin: boolean) {
    super(kit);
    this.mobility = 0.15;
    this.airGravity = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'rk_palm', (n) => {
      if (n !== 'cast') return;
      const hand = sock(f, 'palm.L');
      const dir = aim(f, g).sub(hand);
      if (dir.lengthSq() < 1e-4) f.forward(dir);
      dir.normalize();
      const origin = hand.addScaledVector(dir, 0.25);
      g.addProjectile(new BlueFire(g, f, origin, dir, this.twin ? { len: 20, half: 0.36, damage: 95, blast: 2.6, twin: true } : { len: 13, half: 0.28, damage: 40, blast: 1.4 }));
      if (this.twin) g.callout('双蓮蒼火墜', 'HADŌ #73 — SŌREN SŌKATSUI', '#8fd3f0');
      else g.callout('蒼火墜', 'HADŌ #33 — SŌKATSUI', '#7fc7ec');
      f.push.addScaledVector(dir.setY(0), -3);
    });
  }
}

/** E (sealed): Bakudō #4 Hainawa, and Bakudō #61 Rikujōkōrō grown out of its light. */
class BindAction extends SkillAction {
  readonly name = 'bind';
  private rope: Hainawa | null = null;
  constructor(kit: RukiaKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'rk_rope', (n) => {
      if (n === 'throw' && !this.target.dead) {
        this.rope = new Hainawa(g, f, () => sock(f, 'palm.L'), this.target, 1.2);
        g.addProjectile(this.rope);
        g.callout('這縄', 'BAKUDŌ #4 — HAINAWA', '#ffe45c');
      }
      if (n === 'bind' && this.rope?.bound && !this.target.dead) {
        this.rope.hold = Math.min(this.rope.hold, 0.3);
        this.kit.bound = new Rikujokoro(g, f, this.target, 2.6);
        g.addProjectile(this.kit.bound);
        g.callout('六杖光牢', 'BAKUDŌ #61 — RIKUJŌKŌRŌ', '#fff2a6');
      }
    });
  }
}

/** R (sealed): Hadō #4 Byakurai — pale lightning from two fingers. */
class ByakuraiAction extends SkillAction {
  readonly name = 'byakurai';
  constructor(kit: RukiaKit) {
    super(kit);
    this.mobility = 0.1;
    this.airGravity = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'rk_point', (n) => {
      if (n !== 'cast') return;
      const emitter = f.visual.rig.sockets.get('finger.L')!;
      g.addProjectile(new CeroBeam(g, f, emitter, () => aim(f, g), { charge: 0.04, fire: 0.3, radius: 0.12, damage: 55, power: 400, core: '#FFFFFF', body: '#9CC8FF', rim: '#4A7CC8', range: 90, track: 2.2, gain: 1.6 }));
      g.callout('白雷', 'HADŌ #4 — BYAKURAI', '#cfe6ff');
      g.sfx.play('shunpo', f.center(), 1.2);
    });
  }
}

// ------------------------------------------------------------------ Shikai: the dances

/** Q (Shikai): Some no mai, Tsukishiro — the circle round the target, the pillar of light. */
class TsukishiroAction extends SkillAction {
  readonly name = 'tsukishiro';
  constructor(kit: RukiaKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'rk_tsukishiro', (n) => {
      if (n === 'reverse') frostPuff(g, bladeTip(f), 6);
      if (n !== 'circle') return;
      const o = this.target && !this.target.dead ? this.target : null;
      const p = o ? o.pos.clone() : f.pos.clone().addScaledVector(f.forward(), 7);
      p.y = groundAt(g, p.x, p.y + 1.5, p.z, 30) ?? p.y;
      g.addProjectile(new Tsukishiro(g, f, p, 2.7, 95));
      g.callout('初の舞・月白', 'SOME NO MAI, TSUKISHIRO', '#f5fefd');
    });
  }
}

/** E (Shikai): Tsugi no mai, Hakuren — one stab, four more in a semicircle, then the avalanche of cold. */
class HakurenAction extends SkillAction {
  readonly name = 'hakuren';
  constructor(kit: RukiaKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.25;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'rk_hakuren', (n) => {
      if (n.startsWith('stab')) {
        const tip = bladeTip(f);
        const gy = groundAt(g, tip.x, tip.y + 0.5, tip.z, 3);
        if (gy !== null) frostWorld(g, new THREE.Vector3(tip.x, gy + 0.2, tip.z), n === 'stab0' ? 1.2 : 0.6, 300);
        frostPuff(g, tip, 6);
        g.sfx.play('crack', tip, 0.6);
      }
      if (n === 'gather') g.callout('次の舞・白漣', 'TSUGI NO MAI, HAKUREN', '#e6f4fa');
      if (n !== 'release') return;
      const tip = bladeTip(f);
      const dir = aim(f, g).sub(tip).normalize();
      g.addProjectile(new ColdWave(g, f, tip, dir, { len: 26, half: 0.36, speed: 30, damage: 70, freeze: 1.6, prison: 'block', scale: 1, spikes: true }));
      f.aura.flare(1.3, 0.5);
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // ice particles stream up out of the holes and gather at the tip
    if (this.t > 0.9 && this.t < 1.18) {
      const tip = bladeTip(f);
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2, r = 0.8 + Math.random() * 1.2;
        const p = new THREE.Vector3(tip.x + Math.cos(a) * r, f.pos.y + 0.1, tip.z + Math.sin(a) * r);
        g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (tip.x - p.x) * 3.5, vy: (tip.y - p.y) * 3.5, vz: (tip.z - p.z) * 3.5, size: 0.08, sizeEnd: 0.03, life: 0.28, r: 0.9, g: 0.98, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
      }
    }
  }
}

/** R: San no mai, Shirafune — the thrust whose blade grows on in ice (absolute zero in the Bankai). */
class ShirafuneAction extends SkillAction {
  readonly name = 'shirafune';
  private ice: PropMesh | null = null;
  private grownAt = -1;
  private broken = false;
  private seen = new Set<number>();
  constructor(kit: RukiaKit, readonly absolute: boolean) {
    super(kit);
    this.mobility = 0.05;
    this.airGravity = 0.05;
  }
  private get len(): number {
    return SHIRAFUNE_LEN * (this.absolute ? 2 : 1);
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = { damage: this.absolute ? 50 : 34, knock: 8, launch: 2, heavy: true, hitstop: 0.09, shake: 0.35, cut: 420 };
    this.playClip(f, 'rk_shirafune', (n) => {
      if (n === 'step') f.push.addScaledVector(f.forward(), 10);
      if (n === 'grow') this.grow(f, g);
      if (n === 'shatter') this.shatter(f, g);
    });
  }
  private grow(f: Fighter, g: Game): void {
    const sword = f.visual.props.get('sword');
    if (!sword) return;
    this.ice = new PropMesh(rukiaProp('shirafune'));
    this.ice.position.set(0, 0, BLADE_TIP_Z - 0.05);
    this.ice.scale.set(this.absolute ? 1.3 : 1, this.absolute ? 1.3 : 1, 0.001);
    sword.add(this.ice);
    this.grownAt = this.t;
    f.def = { ...f.def, blade: { ...(f.def.blade ?? BLADE_SHIKAI), tip: [0, 0, BLADE_TIP_Z + this.len] } };
    f.bladeValid = false;
    g.callout('参の舞・白刀', 'SAN NO MAI, SHIRAFUNE', '#e6f4fa');
    g.sfx.play('crack', bladeTip(f), 1);
  }
  private shatter(f: Fighter, g: Game): void {
    if (this.broken || !this.ice) return;
    this.broken = true;
    this.ice.updateWorldMatrix(true, false);
    const a = new THREE.Vector3(0, 0, 0).applyMatrix4(this.ice.matrixWorld);
    const b = new THREE.Vector3(0, 0, 3).applyMatrix4(this.ice.matrixWorld);
    const c = a.clone().add(b).multiplyScalar(0.5);
    g.addProjectile(new GlassShards(g, c, new THREE.Vector3(Math.abs(b.x - a.x) * 0.5 + 0.2, Math.abs(b.y - a.y) * 0.5 + 0.2, Math.abs(b.z - a.z) * 0.5 + 0.2), 50, 3, 1.4, f.pos.y, ICE_TINT, 0.8));
    g.sfx.play('shatter', c, 1);
    this.ice.removeFromParent();
    this.ice.material.dispose();
    this.ice = null;
    this.kit.restoreBlade();
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    if (this.ice && this.grownAt >= 0) {
      const k = Math.min(1, (t - this.grownAt) / 0.14);
      this.ice.scale.z = Math.max(0.001, k * (this.len / SHIRAFUNE_LEN));
    }
    f.bladeActive = this.grownAt >= 0 && !this.broken && t <= 0.42;
    if (f.trail) f.trail.emitting = f.bladeActive;
    for (const id of f.bladeHits) {
      if (this.seen.has(id)) continue;
      this.seen.add(id);
      const o = g.fighters.find((x) => x.id === id);
      if (!o || o.dead) continue;
      // pierced, it keeps freezing: the target and what is round it
      g.addProjectile(new IcePrison(g, f, o, this.absolute ? 1.6 : 1.1, this.absolute ? 70 : 40, this.absolute ? 'obelisk' : 'block', 1));
      frostWorld(g, o.pos.clone().setY(o.pos.y + 0.3), this.absolute ? 3 : 1.6, 900);
    }
  }
  override end(f: Fighter): void {
    super.end(f);
    if (this.ice) {
      this.ice.removeFromParent();
      this.ice.material.dispose();
      this.ice = null;
    }
    this.kit.restoreBlade();
  }
}

/** F: "Mae, Sode no Shirayuki" (the sword turned through a full circle) / "Bankai — Hakka no Togame". */
class ReleaseAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: RukiaKit, readonly bankai: boolean) {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = !bankai;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, this.bankai ? 'rk_bankai' : 'rk_shikai', (n) => {
      if (n === 'raise') g.sfx.play('charge', f.center(), 0.8);
      if (n === 'mae') this.kit.becomeShikai();
      if (n === 'mist') {
        f.aura.flare(1.8, 1.2);
        g.sfx.play('charge', f.center(), 1.2);
      }
      if (n === 'burst') this.kit.becomeBankai();
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // the sword's circle leaves a ring of frost in the air; the Bankai's mist rises round her
    const t = this.t;
    if (!this.bankai && t > 0.3 && t < 0.98 && Math.random() < 0.7) frostPuff(g, bladeTip(f), 1);
    if (this.bankai && t > 0.15 && t < 1.3) this.kit.mist(t < 0.95 ? 0.6 : 1.2);
  }
}

/** E (Bankai): the mist pillar again — everything round her freezes to absolute zero. */
class PillarAction extends SkillAction {
  readonly name = 'pillar';
  constructor(kit: RukiaKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'rk_bankai', (n) => {
      if (n !== 'burst') return;
      this.kit.radialFreeze(10, 85, 'obelisk');
      g.callout('白霞', 'ABSOLUTE ZERO', '#e6f4fa');
    }, 1.5);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t > 0.1 && this.t < 0.9) this.kit.mist(1);
  }
}

/** Q (Bankai): the wave of absolute zero. */
class WaveAction extends SkillAction {
  readonly name = 'wave';
  constructor(kit: RukiaKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'rk_wave', (n) => {
      if (n === 'raise') f.aura.flare(1.6, 0.8);
      if (n !== 'wave') return;
      const c = f.center();
      const dir = aim(f, g).sub(c).normalize();
      g.addProjectile(new ColdWave(g, f, c.addScaledVector(dir, 0.8), dir, { len: 46, half: 0.5, speed: 44, damage: 110, freeze: 2.2, prison: 'obelisk', scale: 1.4, spikes: true }));
      g.callout('白霞罸', 'HAKKA NO TOGAME', '#e6f4fa');
      g.shake(f === g.player ? 0.5 : 0.2);
    });
  }
}

// ------------------------------------------------------------------ the kit

export class RukiaKit implements Kit {
  form: Form = 'sealed';
  flare = false;
  comboIndex = 0;
  ribbon: Ribbon | null = null;
  /** the Rikujōkōrō currently holding someone (Sōkatsui becomes Sōren Sōkatsui on them) */
  bound: Rikujokoro | null = null;
  /** the white body: seconds left at absolute zero, then seconds of thawing */
  whiteT = 0;
  thawT = 0;
  /** Bankai time left (s) */
  togameT = 0;
  private lastEnd = 0;
  private chill = new Map<number, { n: number; t: number }>();
  private stepT = 0;
  private touchT = 0;
  private cd = { heavy: 0, sokatsui: 0, bind: 0, byakurai: 0, tsukishiro: 0, hakuren: 0, shirafune: 0, white: 0, wave: 0, pillar: 0, bankai: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    this.setHands();
    this.applyStats();
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    if (this.bound?.done) this.bound = null;
    for (const [id, c] of this.chill) if (g.time - c.t > 3) this.chill.delete(id);
    // the white body: whatever touches her freezes; frost spreads from her footsteps
    if (this.whiteT > 0) {
      this.whiteT -= dt;
      this.touchT -= dt;
      if (this.touchT <= 0) {
        this.touchT = 0.25;
        for (const o of g.enemiesOf(f)) if (o.pos.distanceTo(f.pos) < 1.5 + o.def.radius && o.hitstun < 0.3) g.addProjectile(new IcePrison(g, f, o, 0.9, 14, 'block', 0.8));
      }
      this.footsteps(dt, 0.6);
      if (Math.random() < 0.3) this.breath();
      if (this.whiteT <= 0) this.beginThaw(3);
    } else if (this.thawT > 0) {
      this.thawT -= dt;
      if (Math.random() < 0.15) this.breath();
      if (this.thawT <= 0) this.endThaw();
    }
    if (this.form === 'bankai') {
      this.togameT -= dt;
      this.footsteps(dt, 0.9);
      if (Math.random() < 0.4) this.breath();
      if (this.togameT <= 0 && !f.busy) this.endBankai();
    }
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

  /** a blade or a kick connected: Shikai cuts chill (three freeze), Bankai cuts freeze outright */
  onHit(o: Fighter): void {
    const { f, g } = this;
    if (o.dead || this.form === 'sealed') return;
    if (this.form === 'bankai') {
      g.addProjectile(new IcePrison(g, f, o, 0.7, 18, 'block', 0.9));
      return;
    }
    const c = this.chill.get(o.id) ?? { n: 0, t: 0 };
    c.n++;
    c.t = g.time;
    frostPuff(g, o.center(), 5);
    if (c.n >= 3) {
      c.n = 0;
      g.addProjectile(new IcePrison(g, f, o, 0.9, 22, 'block', 0.85));
    }
    this.chill.set(o.id, c);
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
    const idx = i % RUKIA_CHAIN.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.8;
    this.f.act(new StringAction(this, RUKIA_CHAIN[idx], idx), true);
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

  heavy(): void {
    const f = this.f;
    if (f.busy && !(f.action instanceof StringAction)) return;
    this.special(new ThrustAction(this), this.form === 'sealed' ? 6 : 10, 'heavy', 1.8);
  }

  /** Q: Sōkatsui (Sōren Sōkatsui on a bound target) / Tsukishiro / the wave of absolute zero. */
  skill1(): void {
    if (this.form === 'sealed') {
      const twin = !!this.bound && !this.bound.done;
      this.special(new SokatsuiAction(this, twin), twin ? 30 : 12, 'sokatsui', twin ? 1 : 2.4);
    } else if (this.form === 'shikai') this.special(new TsukishiroAction(this, this.near(30)), 24, 'tsukishiro', 6);
    else this.special(new WaveAction(this), 30, 'wave', 6);
  }

  /** E: Hainawa → Rikujōkōrō / Hakuren / the mist pillar. */
  skill2(): void {
    if (this.form === 'sealed') {
      const t = this.near(20);
      if (t) this.special(new BindAction(this, t), 16, 'bind', 7);
    } else if (this.form === 'shikai') this.special(new HakurenAction(this), 28, 'hakuren', 7);
    else this.special(new PillarAction(this), 26, 'pillar', 6);
  }

  /** R: Byakurai / Shirafune / absolute-zero Shirafune. */
  skill3(): void {
    if (this.form === 'sealed') this.special(new ByakuraiAction(this), 10, 'byakurai', 2.2);
    else this.special(new ShirafuneAction(this, this.form === 'bankai'), this.form === 'bankai' ? 22 : 16, 'shirafune', 4);
  }

  /** G: the white body (Shikai) / thaw out of the Bankai early. */
  toggle(): void {
    const { f, g } = this;
    if (this.form === 'bankai') {
      if (!f.busy) this.endBankai();
      return;
    }
    if (this.form !== 'shikai' || this.whiteT > 0 || this.thawT > 0 || this.cd.white > 0) return;
    if (!f.spendRei(30)) {
      if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    this.cd.white = 14;
    this.whiteT = 4;
    f.aura.flare(1.6, 0.6);
    frostWorld(g, f.pos.clone().setY(f.pos.y + 0.3), 3, 1500);
    g.addRing(f.pos.clone(), 10, FROST, 0.5);
    g.callout('白', 'THE WHITE BODY — ABSOLUTE ZERO', '#e6f4fa');
    g.sfx.play('crack', f.center(), 1.2);
    this.applyStats();
  }

  release(): void {
    const f = this.f;
    if (this.form === 'bankai' || f.busy || this.thawT > 0) return;
    if (this.form === 'shikai' && this.cd.bankai > 0) {
      if (f === this.g.player) this.g.hud?.showBanner('Still thawing out of the Bankai');
      return;
    }
    if (!f.spendRei(this.form === 'sealed' ? 25 : 60)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new ReleaseAction(this, this.form === 'shikai'), true);
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

  becomeShikai(): void {
    const { f, g } = this;
    if (this.form !== 'sealed') return;
    this.form = 'shikai';
    f.visual.attach('sword', rukiaProp('shikai'), 'grip.R');
    f.def = { ...f.def, blade: BLADE_SHIKAI };
    f.trail?.setColor(BLADE_SHIKAI.color, BLADE_SHIKAI.core);
    f.bladeValid = false;
    this.makeRibbon();
    // a gust of cold bursts out
    g.addRing(f.pos.clone().setY(f.pos.y + 0.2), 12, FROST, 0.5);
    frostWorld(g, f.pos.clone().setY(f.pos.y + 0.3), 2.5, 900);
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.dust.spawn({ x: f.pos.x, y: f.pos.y + 0.3 + Math.random(), z: f.pos.z, vx: Math.cos(a) * 9, vy: Math.random() * 1.5, vz: Math.sin(a) * 9, size: 0.5, sizeEnd: 1.8, life: 0.8, r: 0.9, g: 0.96, b: 1, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 2.5 });
    }
    f.aura.flare(1.4, 0.6);
    g.sfx.play('flare', f.center(), 1);
    g.callout('舞え「袖白雪」', 'MAE, SODE NO SHIRAYUKI', '#e6f4fa');
    this.applyStats();
  }

  becomeBankai(): void {
    const { f, g } = this;
    if (this.form !== 'shikai') return;
    this.form = 'bankai';
    this.whiteT = 0;
    this.thawT = 0;
    this.togameT = 25;
    f.def = { ...f.def, stance: TOGAME_STANCE };
    f.setForm({ asset: rukiaAsset('bankai'), props: [{ key: 'sheath', model: rukiaProp('sheath-empty'), socket: 'hip.L' }] }, AURA_TOGAME, BLADE_TOGAME);
    f.visual.attach('sword', rukiaProp('bankai-sword'), 'grip.R');
    f.bladeValid = false;
    this.setHands();
    this.makeRibbon();
    f.aura.pillarBurst(2.6);
    f.aura.flare(2.2, 1.2);
    g.sfx.play('bankai', f.center());
    g.shake(0.6);
    g.hitstop(0.06);
    g.slowMo(0.4, 0.35);
    g.engine.gr.chroma.offset.set(0.004, 0.004);
    this.radialFreeze(7, 50, 'block');
    g.callout('卍解「白霞罸」', 'BANKAI — HAKKA NO TOGAME', '#e6f4fa');
    this.applyStats();
  }

  /** The Bankai ends (time, or by choice): back to the Shikai — and a slow, dangerous thaw. */
  endBankai(): void {
    const { f, g } = this;
    if (this.form !== 'bankai') return;
    this.form = 'shikai';
    this.cd.bankai = 30;
    f.def = { ...f.def, stance: RUKIA_STANCE };
    f.setForm({ asset: rukiaAsset('shinigami'), props: [{ key: 'sheath', model: rukiaProp('sheath-empty'), socket: 'hip.L' }] }, AURA_RUKIA, BLADE_SHIKAI);
    f.visual.attach('sword', rukiaProp('shikai'), 'grip.R');
    f.bladeValid = false;
    this.setHands();
    this.makeRibbon();
    const c = f.center();
    g.addProjectile(new GlassShards(g, c, new THREE.Vector3(0.7, 0.8, 0.5), 60, 3, 1.6, f.pos.y, ICE_TINT, 0.9));
    g.sfx.play('shatter', c, 1.2);
    g.callout('解凍', 'THAWING', '#a9c4dc');
    this.beginThaw(4);
  }

  private beginThaw(s: number): void {
    const f = this.f;
    this.whiteT = 0;
    this.thawT = s;
    f.def = { ...f.def, speed: { ...SPEED_THAW } };
    this.applyStats();
  }

  private endThaw(): void {
    this.thawT = 0;
    this.f.def = { ...this.f.def, speed: { ...RUKIA_DEF.speed } };
    this.applyStats();
  }

  /** Everyone within r freezes; the ground round her ices over. */
  radialFreeze(r: number, damage: number, shape: 'block' | 'obelisk'): void {
    const { f, g } = this;
    frostWorld(g, f.pos.clone().setY(f.pos.y + 0.3), Math.min(8, r * 0.8), 4000);
    g.addRing(f.pos.clone().setY(f.pos.y + 0.2), r * 2.2, FROST, 0.6);
    for (const o of g.enemiesOf(f)) {
      if (o.pos.distanceTo(f.pos) > r) continue;
      g.addProjectile(new IcePrison(g, f, o, 1.5, damage, shape, 1.1));
    }
    for (let i = 0; i < 50; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.dust.spawn({ x: f.pos.x, y: f.pos.y + 0.2, z: f.pos.z, vx: Math.cos(a) * r * 1.3, vy: Math.random() * 2, vz: Math.sin(a) * r * 1.3, size: 0.8, sizeEnd: 2.6, life: 1.1, r: 0.88, g: 0.95, b: 1, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    }
  }

  /** The cold mist rising round her (the Bankai's pillar). */
  mist(k: number): void {
    const { f, g } = this;
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * 1.6 * k;
      g.engine.dust.spawn({ x: f.pos.x + Math.cos(a) * r, y: f.pos.y + Math.random() * 0.5, z: f.pos.z + Math.sin(a) * r, vx: Math.cos(a) * 0.5, vy: 5 + Math.random() * 6 * k, vz: Math.sin(a) * 0.5, size: 0.7, sizeEnd: 2.4 * k, life: 1.2, r: 0.84, g: 0.92, b: 0.96, alpha: 0.45, alphaEnd: 0, tex: TEX_PUFF, drag: 0.6 });
    }
    if (Math.random() < 0.6) {
      const c = f.center();
      g.engine.glow.spawn({ x: c.x + (Math.random() - 0.5), y: f.pos.y + Math.random(), z: c.z + (Math.random() - 0.5), vx: 0, vy: 8 + Math.random() * 6, vz: 0, size: 0.08, sizeEnd: 0.02, life: 0.8, r: 0.92, g: 0.99, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
    }
  }

  /** Frost spreading from her footsteps while she is this cold. */
  private footsteps(dt: number, r: number): void {
    const { f, g } = this;
    this.stepT -= dt;
    if (this.stepT > 0 || !f.grounded || Math.hypot(f.body.vel.x, f.body.vel.z) < 1) return;
    this.stepT = 0.18;
    frostWorld(g, f.pos.clone().setY(f.pos.y + 0.15), r, 160);
  }

  private breath(): void {
    const { f, g } = this;
    const p = sock(f, 'face').addScaledVector(f.forward(_v), 0.1);
    const fw = f.forward(_w);
    g.engine.dust.spawn({ x: p.x, y: p.y - 0.05, z: p.z, vx: fw.x * 0.6, vy: 0.2, vz: fw.z * 0.6, size: 0.06, sizeEnd: 0.3, life: 0.7, r: 0.92, g: 0.96, b: 1, alpha: 0.4, alphaEnd: 0, tex: TEX_PUFF, drag: 1.5 });
  }

  private makeRibbon(): void {
    const { f, g } = this;
    if (this.ribbon) this.ribbon.done = true;
    const anchor = () => {
      const s = f.visual.props.get('sword');
      if (!s) return null;
      s.updateMatrixWorld(true);
      return new THREE.Vector3(0, 0, POMMEL_Z).applyMatrix4(s.matrixWorld);
    };
    this.ribbon = new Ribbon(g, anchor, () => f.pos.y, 20, 3.2, 0.075, this.form === 'bankai' ? '#DDEDF7' : '#E8EEF3');
    g.addProjectile(this.ribbon);
  }

  /** Shirafune's ice is gone: the blade is its own length again. */
  restoreBlade(): void {
    const f = this.f;
    const b = this.form === 'bankai' ? BLADE_TOGAME : this.form === 'shikai' ? BLADE_SHIKAI : BLADE_SEALED;
    if (f.def.blade?.tip[2] !== b.tip[2]) {
      f.def = { ...f.def, blade: b };
      f.bladeValid = false;
    }
  }

  private applyStats(): void {
    const f = this.f;
    const white = this.whiteT > 0;
    f.power = (this.form === 'bankai' ? 1.5 : this.form === 'shikai' ? 1.15 : 1) * (this.flare ? 1.25 : 1) * (white ? 1.2 : 1);
    // at absolute zero nothing physical gets in (cryostasis); thawing, she is fragile
    f.damageTaken = white ? 0.25 : this.thawT > 0 ? 1.25 : this.form === 'bankai' ? 0.8 : 1;
    f.toughness = this.form === 'bankai' ? 10 : white ? 20 : 0;
    f.aura.target = this.flare ? 0.9 : this.form === 'bankai' ? 0.5 : white ? 0.75 : this.form === 'shikai' ? 0.18 : 0.06;
  }

  formName(): string {
    if (this.form === 'bankai') return `Bankai — Hakka no Togame · ${Math.max(0, Math.ceil(this.togameT))} s`;
    if (this.whiteT > 0) return 'Shikai — the white body · absolute zero';
    if (this.thawT > 0) return 'Thawing';
    return this.form === 'shikai' ? 'Shikai — Sode no Shirayuki' : '13th Division';
  }

  ai(): KitAI {
    return {
      reach: 1.5,
      chain: 4,
      releaseAt: [0.9, 0.45],
      toggleAt: 0.65,
      toggleOn: () => this.form !== 'shikai' || this.whiteT > 0 || this.thawT > 0,
      moves: [
        { name: 'sokatsui', use: () => this.skill1(), min: 3, max: 14, weight: 2, cd: 2.6, when: () => this.form === 'sealed' },
        { name: 'bind', use: () => this.skill2(), min: 3, max: 18, weight: 1.4, cd: 8, when: () => this.form === 'sealed' },
        { name: 'byakurai', use: () => this.skill3(), min: 6, max: 60, weight: 1.6, cd: 2.6, when: () => this.form === 'sealed' },
        { name: 'soren', use: () => this.skill1(), min: 0, max: 18, weight: 6, cd: 1, when: () => this.form === 'sealed' && !!this.bound && !this.bound.done },
        { name: 'thrust', use: () => this.heavy(), min: 0, max: 3, weight: 1.2, cd: 3 },
        { name: 'tsukishiro', use: () => this.skill1(), min: 3, max: 25, weight: 2, cd: 6, when: () => this.form === 'shikai' },
        { name: 'hakuren', use: () => this.skill2(), min: 5, max: 24, weight: 1.6, cd: 7, when: () => this.form === 'shikai' },
        { name: 'shirafune', use: () => this.skill3(), min: 2, max: 4, weight: 1.4, cd: 4, when: () => this.form === 'shikai' },
        { name: 'wave', use: () => this.skill1(), min: 5, max: 42, weight: 2, cd: 6, when: () => this.form === 'bankai' },
        { name: 'pillar', use: () => this.skill2(), min: 0, max: 9, weight: 1.6, cd: 6, when: () => this.form === 'bankai' },
        { name: 'shirafune2', use: () => this.skill3(), min: 2, max: 7, weight: 1.4, cd: 4, when: () => this.form === 'bankai' },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const fm = this.form, cd = this.cd;
    const list: AbilityInfo[] = [{ key: 'LMB', name: fm === 'sealed' ? 'Sode no Shirayuki' : 'Dance', kanji: fm === 'sealed' ? '斬' : '舞' }, { key: 'RMB', name: fm === 'bankai' ? 'Snowflake' : 'Thrust', kanji: '突', cost: fm === 'sealed' ? 6 : 10, cd: cd.heavy, cdMax: 1.8 }];
    if (fm === 'sealed') {
      const twin = !!this.bound && !this.bound.done;
      list.push(
        { key: 'Q', name: twin ? 'Sōren Sōkatsui' : 'Sōkatsui', kanji: twin ? '双蓮' : '蒼火', cost: twin ? 30 : 12, cd: cd.sokatsui, cdMax: 2.4, active: twin, tint: '#8fd3f0' },
        { key: 'E', name: 'Hainawa · Rikujōkōrō', kanji: '縛道', cost: 16, cd: cd.bind, cdMax: 7 },
        { key: 'R', name: 'Byakurai', kanji: '白雷', cost: 10, cd: cd.byakurai, cdMax: 2.2 },
      );
    } else if (fm === 'shikai') {
      list.push(
        { key: 'Q', name: 'Tsukishiro', kanji: '月白', cost: 24, cd: cd.tsukishiro, cdMax: 6 },
        { key: 'E', name: 'Hakuren', kanji: '白漣', cost: 28, cd: cd.hakuren, cdMax: 7 },
        { key: 'R', name: 'Shirafune', kanji: '白刀', cost: 16, cd: cd.shirafune, cdMax: 4 },
        this.whiteT > 0 ? { key: 'G', name: 'Absolute zero', kanji: '白', active: true, timer: this.whiteT / 4, tint: '#e6f4fa' } : { key: 'G', name: this.thawT > 0 ? 'Thawing' : 'White body', kanji: '白', cost: 30, cd: Math.max(cd.white, this.thawT), cdMax: 14 },
      );
    } else {
      list.push(
        { key: 'Q', name: 'Absolute zero wave', kanji: '白霞', cost: 30, cd: cd.wave, cdMax: 6 },
        { key: 'E', name: 'Mist pillar', kanji: '霞', cost: 26, cd: cd.pillar, cdMax: 6 },
        { key: 'R', name: 'Shirafune', kanji: '白刀', cost: 22, cd: cd.shirafune, cdMax: 4 },
        { key: 'G', name: 'Thaw', kanji: '解凍' },
      );
    }
    list.push(
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      fm === 'bankai' ? { key: 'F', name: 'Togame', kanji: '白霞罸', active: true, timer: this.togameT / 25, tint: '#e6f4fa' } : { key: 'F', name: fm === 'sealed' ? 'Shikai' : 'Bankai', kanji: fm === 'sealed' ? '舞' : '卍解', cost: fm === 'sealed' ? 25 : 60, cd: fm === 'shikai' ? cd.bankai : 0, cdMax: 30, tint: '#e6f4fa' },
    );
    return list;
  }
}
