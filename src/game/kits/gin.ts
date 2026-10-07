// Gin Ichimaru's kit (docs/roster/B1-captains-1.md §4, Kit proposal). Shinsō: effortless one-handed flicks
// whose last cut shoots the blade out of its point; RMB "Ikorose, Shinsō" — the full extension, fifty
// metres, that bores through walls and carries the target with it (the Seireitei gate); Q the extended
// sweep, the blade held long and carried across the front so it halves buildings; E Hakufuku, phantom
// blossoms and sleep; R Sentan Hakuja, the white cloth coils round the target and with a flash it is
// somewhere else; G the eyes open (the grin goes; he is serious). F: Bankai, Kamishini no Yari — nothing
// about him changes but a pulse of violet: the thrusts reach across the town near instantly and every hit
// leaves a sliver inside; RMB the swing that splits the town, Q Butō (both hands, the hilt at the chest —
// the pierce is all but invisible), E Butō: Renjin (a wall of blades), R "Korose": the slivers turn to
// poison and whoever carries one comes apart from the inside.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { SHINSO_BASE_Z, SHINSO_TIP_Z, ginAsset, ginProp, type GinFace } from '../../chars/gin';
import { GIN_CHAIN, GIN_CLIPS, GIN_STANCE } from '../../chars/ginClips';
import { Hakufuku, KoroseBurst, SentanHakuja, ShinsoExtension } from '../../vfx/shinso';
import { BoxShape, CapsuleShape } from '../../destruction/shapes';
import { TEX_GLOW } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

export const AURA_GIN: AuraStyle = { core: '#E9DDFF', body: '#8D5BD6', rim: '#4A2C80' };

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE_SHINSO: BladeDef = { prop: 'sword', base: [0, 0, SHINSO_BASE_Z], tip: [0, 0, SHINSO_TIP_Z], color: '#C7A8FF', core: '#F3F3F0' };

/** how far the blade reaches: Shikai (≈ 100 × its length) and the Bankai (the far side of the town) */
const SHIKAI_REACH = 48;
const BANKAI_REACH = 130;
const SLIVER_LIFE = 20;

export const GIN_DEF: FighterDef = {
  id: 'gin',
  name: 'Gin Ichimaru',
  title: 'Captain, 3rd Division',
  build: () => ({ asset: ginAsset('grin'), props: [{ key: 'sword', model: ginProp(), socket: 'grip.R' }] }),
  stance: GIN_STANCE,
  clips: GIN_CLIPS,
  aura: AURA_GIN,
  blade: BLADE_SHINSO,
  hp: 950,
  rei: 140,
  speed: { run: 10.5, sprint: 31, jump: 13, dash: 30, dashTime: 0.1 },
  radius: 0.38,
  height: 1.85,
};

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();

function aimAt(f: Fighter, g: Game, out = new THREE.Vector3()): THREE.Vector3 {
  if (f.faceTarget) return out.copy(f.faceTarget);
  if (f === g.player) return g.aimPoint(f, out);
  return f.center(out).addScaledVector(f.forward(), 40);
}

/** distance from p to the segment a→b */
function segDist(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3): number {
  const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z;
  const l2 = abx * abx + aby * aby + abz * abz || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby + (p.z - a.z) * abz) / l2));
  return Math.hypot(p.x - (a.x + abx * t), p.y - (a.y + aby * t), p.z - (a.z + abz * t));
}

// ------------------------------------------------------------------ the string

class FlickAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private window: [number, number] = [0.1, 0.2];
  queued = false;
  constructor(readonly kit: GinKit, readonly clip: string, readonly index: number) {
    super();
    this.name = clip;
    this.mobility = 0.18;
    this.airGravity = 0.15;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    const hit = c.events.hit ?? 0.13;
    this.window = [hit - 0.04, hit + 0.06];
    f.bladeHits.clear();
    f.bladeSpec = { damage: 15, knock: 5, launch: this.index === 1 ? 3 : 0, hitstop: 0.04, shake: 0.1, cut: 160 };
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n !== 'step') return;
        const tgt = f.faceTarget;
        const extra = tgt ? Math.min(4, Math.max(0, f.pos.distanceTo(tgt) - 1.6)) : 0;
        f.push.addScaledVector(f.forward(), 5 + extra * 2.4);
        g.sfx.play('swing', f.center(), 0.8);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    f.bladeActive = t >= this.window[0] && t <= this.window[1];
    if (f.trail) f.trail.emitting = t >= this.window[0] - 0.03 && t <= this.window[1] + 0.06;
    for (const id of f.bladeHits) this.kit.onBladeHit(id);
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
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= this.window[0] + 0.04;
    return false;
  }
}

abstract class SkillAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: GinKit) {
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
    this.kit.retract();
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > this.dur * 0.6;
  }
}

/** a thrust that shoots the blade out of its point: the 4th flick (short), the snipe, the gate push */
class ThrustAction extends SkillAction {
  readonly name: string;
  constructor(kit: GinKit, readonly clip: string, readonly reach: number, readonly speed: number, readonly damage: number, readonly carry: boolean, readonly callout?: [string, string]) {
    super(kit);
    this.name = clip;
    this.mobility = 0.05;
    this.armor = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, this.clip, (n) => {
      if (n === 'step') g.sfx.play('swing', f.center(), 0.7);
      if (n === 'fx') {
        this.kit.extend(this.reach, this.speed, { damage: this.damage, carry: this.carry, thrust: true });
        if (this.callout) g.callout(this.callout[0], this.callout[1], '#d9c8ff');
        g.sfx.play(this.reach > 30 ? 'beam' : 'swing', f.center(), this.reach > 30 ? 0.9 : 0.6);
      }
      if (n === 'retract') this.kit.retract();
    });
  }
}

/** the extended sweep (Q) and the Bankai's town splitter (RMB) */
class SweepAction extends SkillAction {
  readonly name: string;
  constructor(kit: GinKit, readonly clip: string, readonly reach: number, readonly damage: number, readonly callout: [string, string]) {
    super(kit);
    this.name = clip;
    this.mobility = 0;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, this.clip, (n) => {
      if (n === 'fx') {
        this.kit.extend(this.reach, this.reach * 6, { damage: this.damage, carry: false, thrust: false });
        g.callout(this.callout[0], this.callout[1], '#d9c8ff');
        g.sfx.play('beam', f.center(), 0.8);
      }
      if (n === 'sweep') this.kit.sweeping = true;
      if (n === 'done') this.kit.sweeping = false;
      if (n === 'retract') this.kit.retract();
    });
  }
  override end(f: Fighter): void {
    this.kit.sweeping = false;
    super.end(f);
  }
}

/** Butō (one shot) and Butō: Renjin (a dozen): the hilt at the chest, the pierce near invisible */
class ButoAction extends SkillAction {
  readonly name: string;
  constructor(kit: GinKit, readonly renjin: boolean) {
    super(kit);
    this.name = renjin ? 'renjin' : 'buto';
    this.mobility = 0;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, this.renjin ? 'gn_renjin' : 'gn_buto', (n) => {
      if (n === 'set') g.callout(this.renjin ? '無踏連刃' : '無踏', this.renjin ? 'BUTŌ: RENJIN' : 'BUTŌ', '#d9c8ff');
      if (!n.startsWith('fire')) return;
      const i = Number(n.slice(4));
      this.kit.pierce(this.renjin ? 0.11 : 0, this.renjin ? 34 : 120, this.renjin ? i : -1);
    });
  }
}

/** E (Shikai): Hakufuku — the blossoms fall, the sight blurs, the target sleeps. */
class HakufukuAction extends SkillAction {
  readonly name = 'hakufuku';
  constructor(kit: GinKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'gn_hakufuku', (n) => {
      if (n !== 'cast' || this.target.dead) return;
      const o = this.target;
      g.addProjectile(new Hakufuku(g, o, 2.6));
      g.callout('白伏', 'HAKUFUKU', '#c7a8ff');
      o.hitstun = Math.max(o.hitstun, o.def.boss ? 0.8 : 2.2);
      o.stopAction();
      g.damage(o, 10, f, new THREE.Vector3(), { knock: 0, quiet: true, color: '#C7A8FF' });
      g.sfx.play('flare', o.center(), 0.5);
    });
  }
}

/** R (Shikai): Sentan Hakuja — the cloth coils round the target and takes it somewhere else. */
class HakujaAction extends SkillAction {
  readonly name = 'hakuja';
  constructor(kit: GinKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'gn_hakuja', (n) => {
      if (n !== 'throw' || this.target.dead) return;
      const o = this.target;
      // somewhere else: well away from him, high, to fall
      const a = Math.random() * Math.PI * 2;
      const dest = new THREE.Vector3(f.pos.x + Math.cos(a) * 16, Math.max(f.pos.y, o.pos.y) + 9, f.pos.z + Math.sin(a) * 16);
      g.addProjectile(new SentanHakuja(g, f, o, dest, () => g.damage(o, 24, f, new THREE.Vector3(0, -1, 0), { knock: 0, launch: 0, heavy: true, hitstop: 0.05 })));
      g.callout('千反白蛇', 'SENTAN HAKUJA', '#f3f3f0');
    });
  }
}

/** G: the eyes open (or close again). */
class EyesAction extends SkillAction {
  readonly name = 'eyes';
  constructor(kit: GinKit) {
    super(kit);
    this.mobility = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'gn_eyes', (n) => {
      if (n === 'open') this.kit.setFace(this.kit.face === 'grin' ? 'open' : 'grin');
    });
  }
}

/** F: "Ban… kai. Kamishini no Yari." — nothing changes but a pulse of violet. */
class BankaiAction extends SkillAction {
  readonly name = 'release';
  constructor(kit: GinKit) {
    super(kit);
    this.invulnerable = true;
  }
  override start(f: Fighter, g: Game): void {
    g.callout('卍解', 'BANKAI', '#d9c8ff');
    this.playClip(f, 'gn_bankai', (n) => {
      if (n === 'pulse') this.kit.becomeBankai();
    });
  }
}

/** R (Bankai): "Korose, Kamishini no Yari." */
class KoroseAction extends SkillAction {
  readonly name = 'korose';
  constructor(kit: GinKit) {
    super(kit);
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    this.playClip(f, 'gn_korose', (n) => {
      if (n !== 'cast') return;
      g.callout('殺せ 神殺鎗', 'KOROSE, KAMISHINI NO YARI', '#b48cff');
      this.kit.korose();
    });
  }
}

// ------------------------------------------------------------------ the kit

interface Reach {
  damage: number;
  /** drive the target along the blade (the gate push) */
  carry: boolean;
  /** a thrust (bores while it grows) rather than a sweep */
  thrust: boolean;
}

export class GinKit implements Kit {
  bankai = false;
  face: GinFace = 'grin';
  flare = false;
  comboIndex = 0;
  /** the blade is held long and being swept */
  sweeping = false;
  private lastEnd = 0;
  private ext: ShinsoExtension;
  private extTarget = 0;
  private extSpeed = 0;
  private reach: Reach = { damage: 0, carry: false, thrust: true };
  private extHits = new Set<number>();
  private prevTip = new THREE.Vector3();
  private prevBase = new THREE.Vector3();
  private hadPrev = false;
  private carried: Fighter | null = null;
  /** fighter id → time the sliver dissolves on its own */
  private slivers = new Map<number, number>();
  readonly cd = { heavy: 0, sweep: 0, hakufuku: 0, hakuja: 0, eyes: 0, buto: 0, renjin: 0, split: 0, korose: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    this.ext = new ShinsoExtension(SHINSO_TIP_Z);
    this.attachExtension();
    this.applyStats();
  }

  private attachExtension(): void {
    this.ext.group.removeFromParent();
    this.f.visual.props.get('sword')?.add(this.ext.group);
    // the sword hand closed on the hilt, the left hand open in its sleeve
    const rig = this.f.visual.rig;
    rig.setBoneVisible('fist.R', true);
    rig.setBoneVisible('palm.R', false);
    rig.setBoneVisible('fist.L', false);
    rig.setBoneVisible('palm.L', true);
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 5;
      if (f.rei <= 0) this.toggleFlare();
    }
    for (const [id, until] of this.slivers) if (g.time > until) this.slivers.delete(id);
    this.updateExtension(dt);
  }

  // ---------------------------------------------------------------- the extension

  /** shoot the blade out to `reach` metres at `speed` m/s */
  extend(reach: number, speed: number, o: Reach): void {
    this.extTarget = reach;
    this.extSpeed = speed;
    this.reach = o;
    this.extHits.clear();
    this.carried = null;
    this.hadPrev = false;
    const s = this.f.visual.props.get('sword');
    if (s) {
      const c = this.f.center();
      this.g.engine.glow.spawn({ x: c.x, y: c.y + 0.2, z: c.z, size: 0.6, sizeEnd: 0.1, life: 0.15, r: 0.95, g: 0.97, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    }
  }

  retract(): void {
    this.extTarget = 0;
    this.extSpeed = Math.max(this.extSpeed, 160);
    this.sweeping = false;
    this.carried = null;
  }

  /** the blade's real point and its axis in the world */
  private bladeAxis(tip: THREE.Vector3, dir: THREE.Vector3): boolean {
    const f = this.f;
    if (!f.bladeValid) return false;
    tip.copy(f.blade.tip);
    dir.subVectors(f.blade.tip, f.blade.base);
    const l = dir.length();
    if (l < 1e-4) return false;
    dir.divideScalar(l);
    return true;
  }

  private updateExtension(dt: number): void {
    const { f, g } = this;
    const ext = this.ext;
    const before = ext.length;
    if (ext.length < this.extTarget) ext.length = Math.min(this.extTarget, ext.length + this.extSpeed * dt);
    else if (ext.length > this.extTarget) ext.length = Math.max(this.extTarget, ext.length - Math.max(this.extSpeed, 160) * dt);
    ext.update(dt);
    if (ext.length < 0.05 || f.dead) {
      this.hadPrev = false;
      return;
    }
    const tip = _v, dir = _w;
    if (!this.bladeAxis(tip, dir)) return;
    const end = tip.clone().addScaledVector(dir, ext.length);
    const bankai = this.bankai;
    // growing: it bores through whatever is in the way
    if (ext.length > before + 0.01 && this.reach.thrust) {
      const a = tip.clone().addScaledVector(dir, before);
      g.engine.destruction.carve(new CapsuleShape(a, end.clone(), bankai ? 0.55 : 0.4), { mode: 'bore', power: bankai ? 2600 : 1300, dir: dir.clone(), sparks: [0.85, 0.9, 1], dust: 0.35 });
    }
    // swept while long: a thin cut across everything between the last position and this one
    if (this.sweeping && this.hadPrev) this.cutSweep(this.prevBase, this.prevTip, tip, end);
    // whoever the blade passes through
    for (const o of g.enemiesOf(f)) {
      if (this.extHits.has(o.id)) continue;
      const c = o.center();
      let hit = segDist(c, tip, end) < o.def.radius + (bankai ? 0.45 : 0.35);
      if (!hit && this.sweeping && this.hadPrev) {
        // the sweep moved a long way this step: sample the swept quad finely
        const n = Math.ceil(ext.length / 0.6);
        for (let i = 0; i <= n && !hit; i++) {
          const u = i / n;
          for (let k = 1; k <= 3 && !hit; k++) {
            const w = k / 3;
            const px = (this.prevBase.x + (this.prevTip.x - this.prevBase.x) * u) * (1 - w) + (tip.x + (end.x - tip.x) * u) * w;
            const pz = (this.prevBase.z + (this.prevTip.z - this.prevBase.z) * u) * (1 - w) + (tip.z + (end.z - tip.z) * u) * w;
            const py = (this.prevBase.y + (this.prevTip.y - this.prevBase.y) * u) * (1 - w) + (tip.y + (end.y - tip.y) * u) * w;
            if (Math.hypot(px - o.pos.x, pz - o.pos.z) < o.def.radius + 0.4 && py > o.pos.y - 0.2 && py < o.pos.y + o.def.height + 0.2) hit = true;
          }
        }
      }
      if (!hit) continue;
      this.extHits.add(o.id);
      g.damage(o, this.reach.damage, f, dir.clone(), { knock: this.reach.carry ? 4 : 10, launch: 1.5, heavy: this.reach.damage >= 40, hitstop: 0.06, shake: 0.3, color: '#E9DDFF' });
      g.sparks(c, dir, '#e9ddff', 12);
      if (bankai) this.plant(o);
      if (this.reach.carry && !o.def.boss) this.carried = o;
    }
    // the gate push: the target rides the point outward
    const o = this.carried;
    if (o && !o.dead && ext.length < this.extTarget) {
      const p = tip.clone().addScaledVector(dir, ext.length + o.def.radius + 0.2);
      o.body.pos.set(p.x, Math.max(o.body.pos.y, p.y - o.def.height * 0.5), p.z);
      o.body.vel.set(dir.x * 8, 0, dir.z * 8);
      o.hitstun = Math.max(o.hitstun, 0.3);
    }
    this.prevBase.copy(tip);
    this.prevTip.copy(end);
    this.hadPrev = true;
  }

  /** the long blade carried across: one thin box over the swept region (like a sword's sweep, but huge) */
  private cutSweep(pb: THREE.Vector3, pt: THREE.Vector3, cb: THREE.Vector3, ct: THREE.Vector3): void {
    const mb = new THREE.Vector3().addVectors(pb, cb).multiplyScalar(0.5);
    const mt = new THREE.Vector3().addVectors(pt, ct).multiplyScalar(0.5);
    const along = new THREE.Vector3().subVectors(mt, mb);
    const len = along.length();
    if (len < 0.5) return;
    along.divideScalar(len);
    const sweep = new THREE.Vector3().subVectors(ct, pt);
    sweep.addScaledVector(along, -sweep.dot(along));
    const sl = sweep.length();
    if (sl < 0.05) return;
    sweep.divideScalar(sl);
    const nrm = new THREE.Vector3().crossVectors(sweep, along).normalize();
    _m.makeBasis(along, nrm, sweep);
    _q.setFromRotationMatrix(_m);
    const center = new THREE.Vector3().addVectors(mb, mt).multiplyScalar(0.5);
    this.g.engine.destruction.carve(new BoxShape(center, new THREE.Vector3(len * 0.5 + 0.2, 0.1, sl * 0.5 + 0.1), _q.clone()), { mode: 'cut', power: this.bankai ? 2400 : 1100, dir: sweep.clone(), sparks: [0.85, 0.9, 1], dust: 0.5 });
  }

  /** Butō: a pierce along the aim, near instant; `spread` scatters Renjin's blades round the aim */
  pierce(spread: number, damage: number, shot: number): void {
    const { f, g } = this;
    const from = f.center().addScaledVector(f.forward(), 0.4);
    const dir = aimAt(f, g).sub(from).normalize();
    if (spread > 0) {
      const side = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
      const a = (Math.random() - 0.5) * 2 * spread, b = (Math.random() - 0.5) * 1.4 * spread;
      dir.addScaledVector(side, a).add(new THREE.Vector3(0, b, 0)).normalize();
    }
    const end = from.clone().addScaledVector(dir, BANKAI_REACH);
    g.engine.destruction.carve(new CapsuleShape(from.clone().addScaledVector(dir, 1), end, 0.5), { mode: 'bore', power: 2600, dir: dir.clone(), sparks: [0.85, 0.9, 1], dust: 0.3 });
    // the line of it: a streak of light that is gone almost before it is seen
    const n = 24;
    for (let i = 0; i < n; i++) {
      const p = from.clone().addScaledVector(dir, (i / n) * BANKAI_REACH * 0.6);
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: dir.x * 30, vy: dir.y * 30, vz: dir.z * 30, size: 0.14, sizeEnd: 0.03, life: 0.08, r: 0.95, g: 0.97, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    }
    for (const o of g.enemiesOf(f)) {
      if (segDist(o.center(), from, end) > o.def.radius + 0.5) continue;
      g.damage(o, damage, f, dir.clone(), { knock: shot < 0 ? 14 : 3, launch: 1, heavy: shot < 0, hitstop: shot < 0 ? 0.12 : 0.03, shake: shot < 0 ? 0.5 : 0.15, color: '#E9DDFF' });
      g.sparks(o.center(), dir, '#e9ddff', 8);
      this.plant(o);
    }
    g.sfx.play(shot < 0 ? 'beam' : 'swing', from, shot < 0 ? 1.2 : 0.5);
    if (shot < 0) g.shake(f === g.player ? 0.4 : 0.15);
  }

  /** a hit with the Bankai leaves a sliver of it inside */
  private plant(o: Fighter): void {
    if (!this.bankai) return;
    this.slivers.set(o.id, this.g.time + SLIVER_LIFE);
  }

  /** a blade-sweep hit from the flicks (the Bankai's flicks plant slivers too) */
  onBladeHit(id: number): void {
    if (!this.bankai) return;
    const o = this.g.fighters.find((x) => x.id === id);
    if (o) this.plant(o);
  }

  get sliverCount(): number {
    return this.slivers.size;
  }

  /** "Korose": every sliver becomes poison */
  korose(): void {
    const { f, g } = this;
    for (const o of g.enemiesOf(f)) {
      if (!this.slivers.has(o.id)) continue;
      this.slivers.delete(o.id);
      g.addProjectile(new KoroseBurst(g, o, () => {
        if (o.dead) return;
        const amount = Math.min(o.maxHp * 0.3 + 70, o.def.boss ? 260 : 9999);
        g.damage(o, amount, f, new THREE.Vector3(), { knock: 2, launch: 2, heavy: true, hitstop: 0.15, shake: 0.6, color: '#B48CFF' });
        o.hitstun = Math.max(o.hitstun, 0.8);
      }));
    }
  }

  // ---------------------------------------------------------------- input

  target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 140, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 140);
  }

  private near(range: number): Fighter | null {
    const t = this.target();
    return t && t.pos.distanceTo(this.f.pos) <= range ? t : null;
  }

  private special(a: FighterAction, cost: number, cdKey: keyof typeof this.cd, cd: number): boolean {
    const f = this.f;
    if (this.cd[cdKey] > 0 || f.dead) return false;
    if (f.action && !f.action.canCancel(a)) return false;
    if (f.hitstun > 0 || f.dashT > 0) return false;
    if (!f.spendRei(cost)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return false;
    }
    this.cd[cdKey] = cd;
    f.act(a, true);
    return true;
  }

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof FlickAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const idx = i % GIN_CHAIN.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.8;
    const clip = GIN_CHAIN[idx];
    // the last of the string shoots the blade out: a short poke, or across the town in Bankai
    if (clip === 'gn_poke') {
      const open = this.face === 'open';
      this.f.act(this.bankai ? new ThrustAction(this, 'gn_snipe', BANKAI_REACH, 1600, 46, false) : new ThrustAction(this, 'gn_poke', open ? 14 : 9, 160, 26, false), true);
    } else this.f.act(new FlickAction(this, clip, idx), true);
  }

  /** RMB: "Ikorose, Shinsō" (the gate push) / the town splitter. */
  heavy(): void {
    if (this.bankai) this.special(new SweepAction(this, 'gn_split', BANKAI_REACH, 110, ['神殺鎗', 'KAMISHINI NO YARI']), 40, 'split', 10);
    else this.special(new ThrustAction(this, 'gn_push', SHIKAI_REACH, 190, 60, true, ['射殺せ 神鎗', 'IKOROSE, SHINSŌ']), 14, 'heavy', 3);
  }

  /** Q: the extended sweep / Butō. */
  skill1(): void {
    if (this.bankai) this.special(new ButoAction(this, false), 20, 'buto', 2.5);
    else this.special(new SweepAction(this, 'gn_sweep', 36, 70, ['神鎗', 'SHINSŌ']), 22, 'sweep', 6);
  }

  /** E: Hakufuku / Butō: Renjin. */
  skill2(): void {
    if (this.bankai) this.special(new ButoAction(this, true), 45, 'renjin', 9);
    else {
      const t = this.near(18);
      if (t) this.special(new HakufukuAction(this, t), 24, 'hakufuku', 12);
    }
  }

  /** R: Sentan Hakuja / Korose. */
  skill3(): void {
    if (this.bankai) {
      if (this.slivers.size > 0) this.special(new KoroseAction(this), 30, 'korose', 6);
      else if (this.f === this.g.player) this.g.hud?.showBanner('No sliver planted yet');
    } else {
      const t = this.near(24);
      if (t) this.special(new HakujaAction(this, t), 26, 'hakuja', 14);
    }
  }

  /** G: the eyes. */
  toggle(): void {
    this.special(new EyesAction(this), 0, 'eyes', 3);
  }

  release(): void {
    const f = this.f;
    if (this.bankai || f.busy) return;
    if (!f.spendRei(50)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new BankaiAction(this), true);
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

  // ---------------------------------------------------------------- forms

  becomeBankai(): void {
    const { f, g } = this;
    this.bankai = true;
    // no change to look at: a pulse of violet and nothing else
    f.aura.flare(2, 0.6);
    g.addRing(f.pos.clone().setY(f.pos.y + 0.05), 14, AURA_GIN.body, 0.5);
    g.sfx.play('bankai', f.center(), 0.6);
    g.callout('神殺鎗', 'KAMISHINI NO YARI', '#d9c8ff');
    g.shake(f === g.player ? 0.3 : 0.1);
    this.applyStats();
  }

  setFace(face: GinFace): void {
    const f = this.f;
    this.face = face;
    f.setForm({ asset: ginAsset(face), props: [{ key: 'sword', model: ginProp(), socket: 'grip.R' }] }, AURA_GIN, BLADE_SHINSO);
    this.attachExtension();
    if (face === 'open') {
      f.aura.flare(1.4, 0.4);
      this.g.sfx.play('flare', f.center(), 0.6);
    }
    this.applyStats();
  }

  private applyStats(): void {
    const f = this.f;
    const open = this.face === 'open';
    f.power = (this.bankai ? 1.35 : 1) * (open ? 1.2 : 1) * (this.flare ? 1.25 : 1);
    f.damageTaken = open ? 0.9 : 1;
    f.toughness = this.bankai ? 6 : 0;
    f.aura.target = this.flare ? 1 : open ? 0.35 : this.bankai ? 0.2 : 0.08;
  }

  formName(): string {
    const eyes = this.face === 'open' ? ' · eyes open' : '';
    if (this.bankai) return `Bankai — Kamishini no Yari${this.slivers.size ? ` · ${this.slivers.size} sliver${this.slivers.size > 1 ? 's' : ''}` : ''}${eyes}`;
    return `Shinsō${eyes}`;
  }

  ai(): KitAI {
    const shikai = () => !this.bankai, bankai = () => this.bankai;
    return {
      reach: 1.9,
      chain: 4,
      releaseAt: [0.6],
      toggleAt: 0.45,
      toggleOn: () => this.face === 'open',
      ranged: () => true,
      moves: [
        { name: 'push', use: () => this.heavy(), min: 6, max: 44, weight: 1.6, cd: 3.5, when: shikai },
        { name: 'sweep', use: () => this.skill1(), min: 4, max: 32, weight: 1.4, cd: 7, when: shikai },
        { name: 'hakufuku', use: () => this.skill2(), min: 3, max: 16, weight: 0.9, cd: 13, when: shikai },
        { name: 'hakuja', use: () => this.skill3(), min: 2, max: 20, weight: 0.7, cd: 15, when: shikai },
        { name: 'snipe', use: () => this.chain(3), min: 10, max: 120, weight: 1.6, cd: 2.5, when: bankai },
        { name: 'buto', use: () => this.skill1(), min: 4, max: 120, weight: 1.8, cd: 3, when: bankai },
        { name: 'renjin', use: () => this.skill2(), min: 3, max: 40, weight: 1.3, cd: 10, when: bankai },
        { name: 'split', use: () => this.heavy(), min: 8, max: 100, weight: 1, cd: 11, when: bankai },
        { name: 'korose', use: () => this.skill3(), min: 0, max: 200, weight: 3, cd: 7, when: () => bankai() && this.slivers.size > 0 },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const b = this.bankai, cd = this.cd;
    const list: AbilityInfo[] = [{ key: 'LMB', name: 'Shinsō', kanji: '神鎗' }];
    if (!b) {
      list.push(
        { key: 'RMB', name: 'Ikorose', kanji: '射殺せ', cost: 14, cd: cd.heavy, cdMax: 3 },
        { key: 'Q', name: 'Extended sweep', kanji: '薙', cost: 22, cd: cd.sweep, cdMax: 6 },
        { key: 'E', name: 'Hakufuku', kanji: '白伏', cost: 24, cd: cd.hakufuku, cdMax: 12 },
        { key: 'R', name: 'Sentan Hakuja', kanji: '千反白蛇', cost: 26, cd: cd.hakuja, cdMax: 14 },
      );
    } else {
      list.push(
        { key: 'RMB', name: 'Town splitter', kanji: '断', cost: 40, cd: cd.split, cdMax: 10 },
        { key: 'Q', name: 'Butō', kanji: '無踏', cost: 20, cd: cd.buto, cdMax: 2.5 },
        { key: 'E', name: 'Butō: Renjin', kanji: '無踏連刃', cost: 45, cd: cd.renjin, cdMax: 9 },
        { key: 'R', name: 'Korose', kanji: '殺せ', cost: 30, cd: cd.korose, cdMax: 6, active: this.slivers.size > 0, tint: '#b48cff' },
      );
    }
    list.push(
      { key: 'G', name: this.face === 'open' ? 'Eyes open' : 'Open the eyes', kanji: '眼', active: this.face === 'open' },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      { key: 'F', name: b ? 'Kamishini no Yari' : 'Bankai', kanji: '卍解', cost: b ? undefined : 50, active: b, tint: '#b48cff' },
    );
    return list;
  }
}
