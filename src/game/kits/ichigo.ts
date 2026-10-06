// Ichigo's kit: Zangetsu 5-hit combo with lunges, heavy ground-cracking chop, Getsuga Tenshō,
// reiatsu flare, the Bankai release and the Hollow mask. Each swing drives the blade sweep (hits +
// world cuts) in its active window, the trail in a wider window, and chains on buffered input.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { VoxelModel } from '../../models/builder';
import { ICHIGO_CLIPS, ICHIGO_COMBO, ICHIGO_STANCE } from '../../chars/ichigoClips';
import { hollowMask, hollowMaskShatter, ichigoAsset, ichigoSword } from '../../chars/ichigo';
import { AURA_ICHIGO_BANKAI, AURA_ICHIGO_HOLLOW, AURA_ICHIGO_SHIKAI } from '../../vfx/aura';
import { GetsugaProjectile } from '../projectiles/getsuga';
import { GETSUGA_BLACK, GETSUGA_BLUE } from '../../vfx/energy';
import { ShardBurst } from '../../vfx/shards';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from '../../vfx/sprites';
import type { AbilityInfo } from '../../ui/hud';

type BladeDef = NonNullable<FighterDef['blade']>;
const BLADE_SHIKAI: BladeDef = { prop: 'sword', base: [0, 0, 0.16], tip: [0, 0, 1.56], color: '#7DDFFD', core: '#F9FFFF' };
const BLADE_BANKAI: BladeDef = { prop: 'sword', base: [0, 0, 0.17], tip: [0, 0, 0.92], color: '#C2304F', core: '#FF9AAE' };
/** masked sword trail */
const TRAIL_HOLLOW = { color: '#D0142F', core: '#FFB3BF' };
/** base movement per form; the mask multiplies it */
const FORM_SPEED = {
  shikai: { run: 9, sprint: 19, jump: 11.5, dash: 10, dashTime: 0.12 },
  bankai: { run: 12, sprint: 26, jump: 12.5, dash: 14, dashTime: 0.12 },
};
/** canon: 11 seconds after a month of Visored training (enough to wreck Grimmjow, then it lapsed) */
export const MASK_TIME = 11;
export const MASK_CD = 15;
const MASK_COST = 20;

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

export const ICHIGO_DEF: FighterDef = {
  id: 'ichigo',
  name: 'Kurosaki Ichigo',
  build: () => {
    const asset = ichigoAsset('shikai');
    return { asset, props: [{ key: 'sword', model: ichigoSword('shikai'), socket: 'grip.R' }] };
  },
  stance: ICHIGO_STANCE,
  clips: ICHIGO_CLIPS,
  aura: AURA_ICHIGO_SHIKAI,
  blade: BLADE_SHIKAI,
  hp: 1000,
  rei: 100,
  speed: { ...FORM_SPEED.shikai },
  radius: 0.4,
  height: 1.75,
};

interface SwingInfo {
  window: [number, number];
  trail: [number, number];
  spec: BladeSpec;
  /** forward / up impulse at the 'step' event */
  lunge?: [number, number];
  /** ground impact at the 'fx' event */
  impact?: { radius: number; power: number };
  /** second hit window (spin) resets hit memory at this time */
  rehit?: number;
}

const SWINGS: Record<string, SwingInfo> = {
  slash1: { window: [0.1, 0.24], trail: [0.08, 0.33], spec: { damage: 16, knock: 6, launch: 0, hitstop: 0.05, shake: 0.12, cut: 170 }, lunge: [7, 0] },
  slash2: { window: [0.09, 0.22], trail: [0.07, 0.32], spec: { damage: 16, knock: 6, launch: 3, hitstop: 0.05, shake: 0.12, cut: 170 }, lunge: [6, 0] },
  slash3: { window: [0.21, 0.31], trail: [0.17, 0.42], spec: { damage: 28, knock: 5, launch: 7, hitstop: 0.08, shake: 0.32, cut: 280 }, lunge: [6.5, 0], impact: { radius: 1.25, power: 70 } },
  slash4: { window: [0.08, 0.47], trail: [0.06, 0.5], spec: { damage: 13, knock: 9, launch: 2, hitstop: 0.04, shake: 0.15, cut: 200 }, lunge: [4, 0], rehit: 0.28 },
  slash5: { window: [0.34, 0.47], trail: [0.3, 0.6], spec: { damage: 45, knock: 18, launch: 6, heavy: true, hitstop: 0.13, shake: 0.6, cut: 420 }, lunge: [7, 8.5], impact: { radius: 2.1, power: 120 } },
};

/** One Zangetsu swing (combo step or heavy). */
export class SwingAction extends FighterAction {
  readonly name: string;
  private info: SwingInfo;
  private dur = 0;
  private comboAt = 0;
  private impacted = false;
  private rehitDone = false;
  queued = false;

  constructor(readonly kit: IchigoKit, readonly clip: string, readonly index: number) {
    super();
    this.name = clip;
    this.info = SWINGS[clip];
    this.mobility = 0.12;
    this.airGravity = 0.12;
  }

  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    f.bladeHits.clear();
    f.bladeSpec = this.info.spec;
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n === 'step' && this.info.lunge) {
          const fw = f.forward();
          // close the distance to the target a bit more
          const tgt = f.faceTarget;
          const extra = tgt ? Math.min(5, Math.max(0, f.pos.distanceTo(tgt) - 2.2)) : 0;
          f.push.addScaledVector(fw, this.info.lunge[0] + extra * 2.2);
          if (this.info.lunge[1] > 0 && f.grounded) f.push.y = this.info.lunge[1];
        }
        if (n === 'fx' && this.info.impact && !this.impacted) {
          this.impacted = true;
          const tip = f.blade.tip.clone();
          const ground = this.groundUnder(g, tip);
          if (ground !== null && tip.y - ground < 1.2) {
            tip.y = ground;
            g.groundImpact(tip, this.info.impact.radius, this.info.impact.power, f.def.aura.body);
            g.shake(this.info.spec.shake);
          }
        }
      },
    });
  }

  private groundUnder(g: Game, p: THREE.Vector3): number | null {
    const w = g.engine.world;
    const vs = w.vs;
    const x = Math.floor(p.x / vs), z = Math.floor(p.z / vs);
    for (let y = Math.floor((p.y + 0.6) / vs); y > Math.floor((p.y - 2.5) / vs); y--) if (w.isSolid(x, y, z)) return (y + 1) * vs;
    return null;
  }

  private swished = false;

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    if (!this.swished && t >= this.info.window[0] - 0.03) {
      this.swished = true;
      g.sfx.play(this.info.spec.damage >= 28 ? 'swingHeavy' : 'swing', f.center());
    }
    f.bladeActive = t >= this.info.window[0] && t <= this.info.window[1];
    if (f.trail) f.trail.emitting = t >= this.info.trail[0] && t <= this.info.trail[1];
    if (this.info.rehit && !this.rehitDone && t >= this.info.rehit) {
      this.rehitDone = true;
      f.bladeHits.clear();
    }
    // chain into the next swing
    if (this.queued && t >= this.comboAt) {
      this.done = true;
      this.kit.chain(f, this.index + 1);
      return;
    }
    if (t >= this.dur) this.done = true;
  }

  override end(f: Fighter): void {
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }

  override canCancel(next: FighterAction): boolean {
    // dash / specials cancel once the hit is out
    if (next.name === 'dash' || next instanceof GetsugaAction) return this.t >= this.info.window[0] + 0.06;
    return false;
  }
}

export class GetsugaAction extends FighterAction {
  readonly name = 'getsuga';
  private fired = false;
  constructor(readonly kit: IchigoKit) {
    super();
    this.mobility = 0.05;
    this.airGravity = 0.05;
    this.armor = 0.5;
  }

  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = { damage: 20, knock: 8, launch: 3, hitstop: 0.06, shake: 0.2, cut: 300 };
    f.anim.play('getsuga', {
      onEvent: (n) => {
        if (n === 'charge') {
          f.aura.flare(1.4, 0.55);
          this.glowBlade(f, 1);
          g.callout('月牙天衝', 'GETSUGA TENSHŌ', f.data.bankai || this.kit.masked ? '#ff6e86' : '#9fe6ff');
          g.sfx.play('flare', f.center(), 0.6);
        }
        if (n === 'fx' && !this.fired) this.fire(f, g);
      },
    });
  }

  private glowBlade(f: Fighter, a: number): void {
    const s = f.visual.props.get('sword');
    if (!s) return;
    const u = s.material.userData.uniforms;
    const c = new THREE.Color(f.def.aura.body);
    u.uEnergy.value.set(c.r, c.g, c.b, a * 0.8);
  }

  private fire(f: Fighter, g: Game): void {
    this.fired = true;
    // aim: lock target or camera direction (pitch allowed)
    const dir = new THREE.Vector3();
    if (f.faceTarget) dir.subVectors(f.faceTarget, f.center());
    else if (f === g.player) dir.subVectors(g.aimPoint(f), f.center());
    else f.forward(dir);
    const flat = Math.hypot(dir.x, dir.z) || 1;
    // keep it level unless locked on: a Getsuga skims the ground rather than diving into it
    dir.y = Math.max(f.faceTarget ? -0.5 : -0.06, Math.min(0.6, dir.y / flat)) * flat;
    dir.normalize();
    // the crescent follows the diagonal swing: tilted ~40° from vertical
    const right = new THREE.Vector3(dir.z, 0, -dir.x).normalize().multiplyScalar(-1);
    const side = new THREE.Vector3(0, 1, 0).multiplyScalar(Math.cos(0.7)).addScaledVector(right, Math.sin(0.7));
    const origin = f.center().addScaledVector(dir, 1.2);
    origin.y += 0.35;
    const bankai = f.data.bankai === true;
    // the masked Getsuga: his "ultimate attack" — black, far bigger and faster
    const m = this.kit.masked;
    g.addProjectile(new GetsugaProjectile(g, f, origin, dir, side, {
      radius: (bankai ? 3.4 : 2.6) * (m ? 1.3 : 1),
      halfAngle: 1.15,
      speed: (bankai ? 52 : 40) * (m ? 1.25 : 1),
      range: (bankai ? 110 : 70) * (m ? 1.3 : 1),
      damage: (bankai ? 140 : 80) * (m ? 1.6 : 1),
      cut: (bankai ? 900 : 520) * (m ? 1.6 : 1),
      colors: (f.data.getsugaColors as typeof GETSUGA_BLUE) ?? GETSUGA_BLUE,
      dark: bankai || m,
    }));
    g.shake(m ? 0.6 : 0.45);
    g.hitstop(0.06);
    g.sfx.play(bankai || m ? 'getsugaBlack' : 'getsuga', origin);
    f.aura.flare(1.8, 0.4);
    g.engine.gr.chroma.offset.set(0.004, 0.004);
    if (f === g.player) g.cam.punchFov(6);
    // recoil
    f.push.addScaledVector(dir, -3);
  }

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const c = f.anim.clip('getsuga')!;
    if (f.trail) f.trail.emitting = this.t > 0.42 && this.t < 0.62;
    f.bladeActive = this.t > 0.45 && this.t < 0.56;
    if (this.t > 0.6) this.glowBlade(f, Math.max(0, 1 - (this.t - 0.6) * 3));
    if (this.t >= c.dur - c.fadeOut * 0.5) this.done = true;
  }

  override end(f: Fighter): void {
    this.glowBlade(f, 0);
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }

  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.fired && this.t > 0.6;
  }
}

/** Bankai release: pillar of reiatsu, callout, (form swap when the Bankai model is ready). */
export class ReleaseAction extends FighterAction {
  readonly name = 'release';
  constructor(readonly kit: IchigoKit) {
    super();
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('release', {
      onEvent: (n) => {
        if (n === 'fx') {
          f.aura.flare(2.2, 1.6);
          g.callout('卍解', 'BANKAI', '#ffffff');
          g.shake(0.5);
        }
        if (n === 'burst') {
          g.sfx.play('bankai', f.center());
          f.aura.pillarBurst(2.4);
          g.groundImpact(f.pos.clone(), 3.2, 90, f.def.aura.body);
          g.shake(0.9);
          g.hitstop(0.12);
          g.slowMo(0.5, 0.35);
          g.engine.gr.chroma.offset.set(0.006, 0.006);
          this.kit.onBankai(f, g);
          // the shockwave pushes enemies away
          for (const o of g.enemiesOf(f)) {
            const d = o.pos.distanceTo(f.pos);
            if (d < 14) g.damage(o, 30 * (1 - d / 14), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 22 * (1 - d / 14), launch: 6, heavy: true });
          }
        }
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 1.5) this.done = true;
  }
}

/** Hollow mask: the left hand claws down over the face and the mask forms behind it. */
export class MaskAction extends FighterAction {
  readonly name = 'mask';
  private formed = false;
  private dur = 0.68;
  constructor(readonly kit: IchigoKit) {
    super();
    this.mobility = 0.2;
    this.airGravity = 0.1;
    this.armor = 0.8;
    this.trackTarget = false;
  }

  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('mask_on')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.aura.flare(1.4, 0.35);
    g.sfx.play('flare', f.center(), 0.7);
    f.anim.play('mask_on', {
      onEvent: (n) => {
        if (n === 'fx' && !this.formed) {
          this.formed = true;
          this.kit.formMask();
        }
      },
    });
  }

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.formed) {
      // black reiatsu and bone-white motes stream into the face
      const p = this.kit.faceWorld(_v);
      for (let i = 0; i < 5; i++) {
        const a = Math.random() * Math.PI * 2, e = Math.random() * 2 - 1, r = 0.5 + Math.random() * 0.9;
        const q = Math.sqrt(1 - e * e);
        const x = p.x + Math.cos(a) * q * r, y = p.y + e * r, z = p.z + Math.sin(a) * q * r;
        const white = Math.random() < 0.45;
        g.engine.glow.spawn({
          x, y, z, vx: (p.x - x) * 4, vy: (p.y - y) * 4, vz: (p.z - z) * 4,
          size: white ? 0.06 : 0.09, sizeEnd: 0.02, life: 0.22, r: white ? 1 : 0.8, g: white ? 0.97 : 0.05, b: white ? 0.92 : 0.12,
          alpha: 1, alphaEnd: 0.3, tex: TEX_STREAK, stretch: 2.5, drag: 0,
        });
      }
    }
    if (this.t >= this.dur) this.done = true;
  }

  override canCancel(next: FighterAction): boolean {
    return this.formed && this.t > 0.45 && (next.name === 'dash' || next instanceof GetsugaAction || next instanceof SwingAction);
  }
}

/** Kit state + input entry points (shared by player and AI controllers). */
export class IchigoKit {
  comboIndex = 0;
  private lastSwingEnd = 0;
  getsugaCd = 0;
  flare = false;
  /** Hollow mask state */
  masked = false;
  maskT = 0;
  maskCd = 0;
  private crackLevel = -1;
  private maskFormT = -1;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.onHurt = (dmg, heavy) => this.onHurt(dmg, heavy);
  }

  get bankai(): boolean {
    return this.f.data.bankai === true;
  }

  update(dt: number): void {
    const f = this.f;
    this.getsugaCd = Math.max(0, this.getsugaCd - dt);
    this.maskCd = Math.max(0, this.maskCd - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    if (this.masked && !f.dead) {
      this.maskT -= dt;
      // cracks spread over the last seconds, then it breaks
      const lvl = this.maskT < 1.3 ? 1 : this.maskT < 3.2 ? 0 : -1;
      if (lvl > this.crackLevel) this.crackMask(lvl);
      if (this.maskT <= 0) this.shatterMask();
      else this.maskFx(dt);
    }
  }

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof SwingAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastSwingEnd > 0.8) this.comboIndex = 0;
    this.chain(f, this.comboIndex);
  }

  chain(f: Fighter, i: number): void {
    const idx = i % ICHIGO_COMBO.length;
    this.comboIndex = idx + 1;
    this.lastSwingEnd = this.g.time + 0.8;
    f.act(new SwingAction(this, ICHIGO_COMBO[idx], idx), true);
  }

  heavy(): void {
    const f = this.f;
    if (f.busy && !(f.action instanceof SwingAction)) return;
    if (f.action instanceof SwingAction && f.action.t < 0.25) return;
    this.comboIndex = 0;
    f.act(new SwingAction(this, f.grounded ? 'slash3' : 'slash5', 2), true);
  }

  getsuga(): void {
    const f = this.f;
    if (this.getsugaCd > 0) return;
    const a = new GetsugaAction(this);
    if (f.action && !f.action.canCancel(a)) return;
    if (!f.spendRei(this.getsugaCost())) return;
    this.getsugaCd = this.getsugaCdMax();
    f.act(a, true);
  }

  private getsugaCost(): number {
    return (this.bankai ? 18 : 25) * (this.masked ? 0.5 : 1);
  }

  private getsugaCdMax(): number {
    return this.masked ? 0.35 : this.bankai ? 0.6 : 1;
  }

  release(): void {
    const f = this.f;
    if (this.bankai || f.busy) return;
    if (!f.spendRei(40)) {
      this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new ReleaseAction(this), true);
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

  /** G: put the Hollow mask on (or tear it off early). */
  mask(): void {
    const f = this.f;
    if (f.dead) return;
    if (this.masked) {
      if (!(f.action instanceof MaskAction)) this.shatterMask();
      return;
    }
    if (this.maskCd > 0 || f.hitstun > 0 || f.dashT > 0) return;
    if (f.action && !(f.action instanceof SwingAction)) return;
    if (!f.spendRei(MASK_COST)) {
      this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new MaskAction(this), true);
  }

  /** World position of the face socket (where the mask sits). */
  faceWorld(out: THREE.Vector3): THREE.Vector3 {
    const s = this.f.visual.rig.sockets.get('face');
    if (!s) return this.f.center(out);
    s.updateWorldMatrix(true, false);
    return s.getWorldPosition(out);
  }

  /** The mask forms (end of the claw gesture): burst, boost, new look. */
  formMask(): void {
    const { f, g } = this;
    this.masked = true;
    this.maskT = MASK_TIME;
    this.crackLevel = -1;
    this.maskFormT = 0;
    this.attachMask();
    this.applyLook();
    this.applyStats();
    const c = f.center();
    const col = AURA_ICHIGO_HOLLOW.body;
    f.aura.flare(1.9, 0.6);
    g.addRing(f.pos.clone().setY(f.pos.y + 0.05), 11, col, 0.6);
    g.addRing(c.clone(), 5, '#ffffff', 0.25);
    if (f.grounded) g.groundImpact(f.pos.clone(), 2.2, 70, col);
    g.callout('虚化', 'HOLLOWFICATION', '#ff3b52');
    g.sfx.play('mask', c);
    g.shake(0.7);
    g.hitstop(0.08);
    g.slowMo(0.35, 0.35);
    g.engine.gr.chroma.offset.set(0.009, 0.009);
    if (f === g.player) g.cam.punchFov(8);
    // the reiatsu wave knocks everything back
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d < 12) g.damage(o, 30 * (1 - d / 12), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 20 * (1 - d / 12), launch: 5, heavy: d < 6 });
    }
    // black and crimson reiatsu bursting outward
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * Math.PI * 2, up = Math.random();
      const sp = 6 + Math.random() * 14;
      const dark = Math.random() < 0.5;
      g.engine.glow.spawn({
        x: c.x, y: c.y, z: c.z, vx: Math.cos(a) * sp * (1 - up * 0.5), vy: up * sp * 0.8, vz: Math.sin(a) * sp * (1 - up * 0.5),
        size: dark ? 0.35 : 0.22, sizeEnd: 0.05, life: 0.45 + Math.random() * 0.4,
        r: dark ? 0.12 : 0.95, g: dark ? 0.0 : 0.08, b: dark ? 0.02 : 0.18, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 3,
      });
    }
  }

  /** The current mask model (clean or cracked). */
  private maskModel(): VoxelModel {
    return this.crackLevel < 0 ? hollowMask() : hollowMaskShatter().cracked[this.crackLevel];
  }

  private attachMask(): void {
    const v = this.f.visual;
    const old = v.props.get('mask');
    const m = v.attach('mask', this.maskModel(), 'face');
    if (old) Object.assign(m.userData, { flash: old.userData.flash, dissolve: old.userData.dissolve });
    // the forehead locks would poke through the mask
    v.rig.setBoneVisible('bangs', false);
  }

  private crackMask(lvl: number): void {
    this.crackLevel = lvl;
    this.attachMask();
    const p = this.faceWorld(_v);
    this.g.sfx.play('crack', p, lvl > 0 ? 1.4 : 1);
    this.chips(p, lvl > 0 ? 10 : 5);
  }

  private chips(p: THREE.Vector3, n: number): void {
    const fw = this.f.forward(_w);
    for (let i = 0; i < n; i++) {
      this.g.engine.glow.spawn({
        x: p.x + fw.x * 0.06, y: p.y, z: p.z + fw.z * 0.06,
        vx: fw.x * 1.5 + (Math.random() - 0.5) * 2.5, vy: Math.random() * 2, vz: fw.z * 1.5 + (Math.random() - 0.5) * 2.5,
        size: 0.035, sizeEnd: 0.02, life: 0.5, r: 1, g: 0.97, b: 0.92, alpha: 1, alphaEnd: 0.6, tex: TEX_GLOW, drag: 1, gravity: -9,
      });
    }
  }

  /** Time is up (or torn off / broken): the mask breaks into its voxel shards. */
  shatterMask(): void {
    const { f, g } = this;
    if (!this.masked) return;
    this.masked = false;
    this.maskCd = MASK_CD;
    this.crackLevel = -1;
    this.maskFormT = -1;
    const m = f.visual.props.get('mask');
    if (m && !f.dead) {
      m.updateWorldMatrix(true, false);
      const origin = this.faceWorld(new THREE.Vector3());
      const fw = f.forward();
      origin.addScaledVector(fw, -0.08);
      g.addProjectile(new ShardBurst(g, hollowMaskShatter().shards, m.matrixWorld, { origin, dir: fw, speed: 4.5, life: 2.6 }));
      g.sfx.play('shatter', origin);
      g.shake(0.3);
    }
    f.visual.detach('mask');
    f.visual.rig.setBoneVisible('bangs', true);
    this.applyLook();
    this.applyStats();
  }

  /** Big hits chip the mask: time off the clock. */
  private onHurt(dmg: number, heavy: boolean): void {
    if (!this.masked || this.f.dead || (!heavy && dmg < 40)) return;
    this.maskT -= heavy ? 1.2 : 0.5;
    const p = this.faceWorld(_v);
    this.chips(p, 6);
    this.g.sfx.play('crack', p, 0.8);
  }

  /** Per sim step while masked: the mask materialises, the eyes leave streaks, it flickers at the end. */
  private maskFx(dt: number): void {
    const m = this.f.visual.props.get('mask');
    if (!m) return;
    if (this.maskFormT >= 0) {
      this.maskFormT += dt;
      const k = this.maskFormT;
      m.userData.dissolve = Math.max(0, 1 - k / 0.14);
      m.userData.flash = Math.max(0, 1 - k / 0.45);
      if (k > 0.45) this.maskFormT = -1;
    } else m.userData.flash = this.maskT < 1 && Math.sin(this.maskT * 38) > 0.5 ? 0.45 : 0;
    // gold irises streak behind fast moves
    m.updateWorldMatrix(true, false);
    for (const sx of [1, -1]) {
      _v.set((sx > 0 ? 2.5 : -2.5) / 48, 0.5 / 48, 2.2 / 48).applyMatrix4(m.matrixWorld);
      this.g.engine.glow.spawn({ x: _v.x, y: _v.y, z: _v.z, size: 0.05, sizeEnd: 0.01, life: 0.16, r: 1, g: 0.85, b: 0.3, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
    // black reiatsu smoking off the mask
    if (Math.random() < 0.35) {
      const p = this.faceWorld(_v);
      this.g.engine.dust.spawn({ x: p.x, y: p.y + 0.1, z: p.z, vx: (Math.random() - 0.5) * 0.4, vy: 1.2, vz: (Math.random() - 0.5) * 0.4, size: 0.12, sizeEnd: 0.5, life: 0.7, r: 0.04, g: 0.02, b: 0.03, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 1 });
    }
  }

  /** Aura, trail, afterimages, rim light and HUD follow the form and the mask. */
  private applyLook(): void {
    const { f, g } = this;
    const style = this.masked ? AURA_ICHIGO_HOLLOW : this.bankai ? AURA_ICHIGO_BANKAI : AURA_ICHIGO_SHIKAI;
    const blade = this.bankai ? BLADE_BANKAI : BLADE_SHIKAI;
    f.aura.setStyle(style);
    f.ghosts.color.set(style.body);
    f.def = { ...f.def, aura: style, blade };
    const tc = this.masked ? TRAIL_HOLLOW : blade;
    f.trail?.setColor(tc.color, tc.core);
    f.data.getsugaColors = this.masked || this.bankai ? GETSUGA_BLACK : GETSUGA_BLUE;
    if (g.hud && f === g.player) {
      g.hud.form = (this.bankai ? 'Bankai — Tensa Zangetsu' : 'Shikai') + (this.masked ? ' · Hollow mask' : '');
      g.hud.vignette = this.masked ? 1 : 0;
    }
  }

  /** Speed, damage, toughness and aura level from form × flare × mask. */
  private applyStats(): void {
    const { f, g } = this;
    const base = this.bankai ? FORM_SPEED.bankai : FORM_SPEED.shikai;
    const m = this.masked;
    f.def = {
      ...f.def,
      speed: { run: base.run * (m ? 1.22 : 1), sprint: base.sprint * (m ? 1.25 : 1), jump: base.jump * (m ? 1.12 : 1), dash: base.dash * (m ? 1.35 : 1), dashTime: base.dashTime },
    };
    f.damageTaken = m ? 0.55 : 1;
    if (f === g.player) g.playerPower = (this.bankai ? 1.3 : 1) * (this.flare ? (this.bankai ? 1.23 : 1.35) : 1) * (m ? 1.75 : 1);
    f.aura.target = this.flare ? 1 : m ? 0.34 : this.bankai ? 0.45 : 0.25;
  }

  /** Called at the release burst. */
  onBankai(f: Fighter, _g: Game): void {
    f.data.bankai = true;
    f.setForm(
      { asset: ichigoAsset('bankai'), props: [{ key: 'sword', model: ichigoSword('bankai'), socket: 'grip.R' }] },
      AURA_ICHIGO_BANKAI,
      BLADE_BANKAI,
    );
    if (this.masked) this.attachMask();
    this.applyLook();
    this.applyStats();
    (f.data.onBankai as ((f: Fighter) => void) | undefined)?.(f);
  }

  abilities(): AbilityInfo[] {
    const b = this.bankai;
    return [
      { key: 'LMB', name: 'Zangetsu', kanji: '斬' },
      { key: 'RMB', name: 'Heavy', kanji: '断' },
      { key: 'Q', name: 'Getsuga', kanji: '月牙', cost: this.getsugaCost(), cd: this.getsugaCd, cdMax: this.getsugaCdMax(), tint: this.masked ? '#ff3b52' : undefined },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      { key: 'F', name: 'Bankai', kanji: '卍解', cost: 40, active: b, tint: '#ff6e86' },
      {
        key: 'G', name: this.masked ? `Mask ${Math.ceil(this.maskT)}s` : 'Mask', kanji: '虚', cost: MASK_COST,
        cd: this.masked ? 0 : this.maskCd, cdMax: MASK_CD, active: this.masked, timer: this.masked ? this.maskT / MASK_TIME : 0, tint: '#ff3b52',
      },
    ];
  }
}
