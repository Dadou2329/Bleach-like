// Ichigo's kit (Shikai): Zangetsu 5-hit combo with lunges, heavy ground-cracking chop, Getsuga
// Tenshō, reiatsu flare and the Bankai release. Each swing drives the blade sweep (hits + world cuts)
// in its active window, the trail in a wider window, and chains on buffered input.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import { ICHIGO_CLIPS, ICHIGO_COMBO, ICHIGO_STANCE } from '../../chars/ichigoClips';
import { buildIchigo, buildZangetsuShikai } from '../../chars/ichigo';
import { AURA_ICHIGO_SHIKAI } from '../../vfx/aura';
import { GetsugaProjectile } from '../projectiles/getsuga';
import { GETSUGA_BLUE } from '../../vfx/energy';
import type { AbilityInfo } from '../../ui/hud';

export const ICHIGO_DEF: FighterDef = {
  id: 'ichigo',
  name: 'Kurosaki Ichigo',
  build: () => {
    const asset = buildIchigo('shikai');
    return { asset, props: [{ key: 'sword', model: buildZangetsuShikai(), socket: 'grip.R' }] };
  },
  stance: ICHIGO_STANCE,
  clips: ICHIGO_CLIPS,
  aura: AURA_ICHIGO_SHIKAI,
  blade: { prop: 'sword', base: [0, 0, 0.16], tip: [0, 0, 1.56], color: '#7DDFFD', core: '#F9FFFF' },
  hp: 1000,
  rei: 100,
  speed: { run: 9, sprint: 19, jump: 11.5, dash: 10, dashTime: 0.12 },
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

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
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
          g.callout('月牙天衝', 'GETSUGA TENSHŌ', '#9fe6ff');
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
    g.addProjectile(new GetsugaProjectile(g, f, origin, dir, side, {
      radius: bankai ? 3.4 : 2.6,
      halfAngle: 1.15,
      speed: bankai ? 52 : 40,
      range: bankai ? 110 : 70,
      damage: bankai ? 140 : 80,
      cut: bankai ? 900 : 520,
      colors: (f.data.getsugaColors as typeof GETSUGA_BLUE) ?? GETSUGA_BLUE,
      dark: bankai,
    }));
    g.shake(0.45);
    g.hitstop(0.06);
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

/** Kit state + input entry points (shared by player and AI controllers). */
export class IchigoKit {
  comboIndex = 0;
  private lastSwingEnd = 0;
  getsugaCd = 0;
  flare = false;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
  }

  update(dt: number): void {
    this.getsugaCd = Math.max(0, this.getsugaCd - dt);
    if (this.flare) {
      this.f.rei -= dt * 6;
      if (this.f.rei <= 0) this.toggleFlare();
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
    if (!f.spendRei(f.data.bankai ? 18 : 25)) return;
    this.getsugaCd = f.data.bankai ? 0.6 : 1.0;
    f.act(a, true);
  }

  release(): void {
    const f = this.f;
    if (f.data.bankai || f.busy) return;
    if (!f.spendRei(40)) {
      this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new ReleaseAction(this), true);
  }

  toggleFlare(): void {
    this.flare = !this.flare;
    this.f.aura.target = this.flare ? 1 : this.f.data.bankai ? 0.45 : 0.25;
    this.g.playerPower = this.flare ? 1.35 : 1;
    if (this.flare) {
      this.f.aura.flare(1.6, 0.4);
      this.g.shake(0.2);
    }
  }

  /** Called at the release burst. */
  onBankai(f: Fighter, g: Game): void {
    f.data.bankai = true;
    f.def.speed.run = 12;
    f.def.speed.sprint = 26;
    f.def.speed.dash = 14;
    g.playerPower = this.flare ? 1.6 : 1.3;
    f.aura.target = 0.45;
    if (g.hud) g.hud.form = 'Bankai — Tensa Zangetsu';
    (f.data.onBankai as ((f: Fighter) => void) | undefined)?.(f);
  }

  abilities(): AbilityInfo[] {
    const b = this.f.data.bankai === true;
    return [
      { key: 'LMB', name: 'Zangetsu', kanji: '斬' },
      { key: 'RMB', name: 'Heavy', kanji: '断' },
      { key: 'Q', name: 'Getsuga', kanji: '月牙', cost: b ? 18 : 25, cd: this.getsugaCd, cdMax: b ? 0.6 : 1 },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      { key: 'F', name: b ? 'Bankai' : 'Bankai', kanji: '卍解', cost: 40, active: b },
    ];
  }
}
