// Byakuya's kit (docs/roster/B1-captains-1.md §6). Sealed: an economical katana chain, a heavy "clean
// bifurcation" that splits the world a beat after the cut, Senka (flash behind, seal the target's
// reiatsu), Byakurai (finger lightning that bores through walls) and Sōkatsui (blue fire).
// F: "Chire, Senbonzakura" — the blade scatters into a thousand petals that orbit him; hilt swings
// send streams, a held torrent tunnels through buildings, a wall of blades guards him.
// F again: Bankai — the sword sinks into the ground, two rows of giant blades rise and shatter into
// the petal ocean: hand-gesture waves, a grand wave that flattens a block, Gōkei, Senkei → Ikka
// Senjinka, and G: Shūkei: Hakuteiken (wings, halo, one white cut).
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game, Projectile } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { byakuyaAsset, byakuyaProp } from '../../chars/byakuya';
import { BYAKUYA_BANKAI_CHAIN, BYAKUYA_BANKAI_STANCE, BYAKUYA_CHAIN, BYAKUYA_CLIPS, BYAKUYA_SHIKAI_CHAIN, BYAKUYA_STANCE } from '../../chars/byakuyaClips';
import { CeroBeam } from '../projectiles/cero';
import { GetsugaProjectile } from '../projectiles/getsuga';
import { SenbonzakuraSwarm } from '../projectiles/senbonzakura';
import { BankaiBlades, SenkeiSwords, WhiteWings } from '../../vfx/kageyoshi';
import { BoxShape, ConeShape, SphereShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';

export const AURA_BYAKUYA: AuraStyle = { core: '#FFFFFF', body: '#F2E4EE', rim: '#C49AB8' };
const BLADE_KATANA: NonNullable<FighterDef['blade']> = { prop: 'sword', base: [0, 0, 0.14], tip: [0, 0, 0.99], color: '#E6EDF6', core: '#FFFFFF' };
const WHITE = { core: '#FFFFFF', body: '#F4F8FF', rim: '#BFD8FF' };

export const BYAKUYA_DEF: FighterDef = {
  id: 'byakuya',
  name: 'Kuchiki Byakuya',
  title: 'Captain, 6th Division',
  build: () => ({
    asset: byakuyaAsset(),
    props: [
      { key: 'sword', model: byakuyaProp('katana'), socket: 'grip.R' },
      { key: 'sheath', model: byakuyaProp('sheath'), socket: 'hip.L' },
    ],
  }),
  stance: BYAKUYA_STANCE,
  clips: BYAKUYA_CLIPS,
  aura: AURA_BYAKUYA,
  blade: BLADE_KATANA,
  hp: 1050,
  rei: 120,
  speed: { run: 9.5, sprint: 22, jump: 11.5, dash: 13, dashTime: 0.12 },
  radius: 0.4,
  height: 1.8,
};

type Form = 'sealed' | 'shikai' | 'bankai';

const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();

interface CutInfo {
  window: [number, number];
  trail: [number, number];
  spec: BladeSpec;
  lunge: number;
  rehit?: number;
}

const CUTS: Record<string, CutInfo> = {
  by_slash1: { window: [0.087, 0.21], trail: [0.07, 0.29], lunge: 8, spec: { damage: 20, knock: 5, launch: 0, hitstop: 0.045, shake: 0.1, cut: 230 } },
  by_slash2: { window: [0.078, 0.19], trail: [0.06, 0.28], lunge: 7, spec: { damage: 20, knock: 6, launch: 2, hitstop: 0.045, shake: 0.1, cut: 230 } },
  by_slash3: { window: [0.073, 0.43], trail: [0.05, 0.45], lunge: 5, rehit: 0.25, spec: { damage: 16, knock: 9, launch: 2, hitstop: 0.04, shake: 0.14, cut: 250 } },
  by_cleave: { window: [0.2, 0.3], trail: [0.16, 0.4], lunge: 6, spec: { damage: 52, knock: 14, launch: 4, heavy: true, hitstop: 0.12, shake: 0.5, cut: 620 } },
};

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

/** Where Byakuya is attacking: lock target, camera aim (player) or straight ahead. */
function aim(f: Fighter, g: Game, out = new THREE.Vector3()): THREE.Vector3 {
  if (f.faceTarget) return out.copy(f.faceTarget);
  if (f === g.player) return g.aimPoint(f, out);
  return f.center(out).addScaledVector(f.forward(_v), 20);
}

// ------------------------------------------------------------------ sealed sword

class CutAction extends FighterAction {
  readonly name: string;
  private info: CutInfo;
  private dur = 0;
  private comboAt = 0;
  private rehitDone = false;
  private split = -1;
  queued = false;

  constructor(readonly kit: ByakuyaKit, readonly clip: string, readonly index: number, readonly heavy = false) {
    super();
    this.name = clip;
    this.info = CUTS[clip];
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
        if (n === 'step') {
          const tgt = f.faceTarget;
          const extra = tgt ? Math.min(5, Math.max(0, f.pos.distanceTo(tgt) - 2)) : 0;
          f.push.addScaledVector(f.forward(), this.info.lunge + extra * 2.2);
          g.sfx.play(this.heavy ? 'swingHeavy' : 'swing', f.center(), 0.9);
        }
      },
    });
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
    // clean bifurcation: a beat after the cut, everything in its plane splits
    if (this.heavy && this.split < 0 && t >= this.info.window[1] + 0.12) {
      this.split = t;
      this.kit.bifurcate(f, g);
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
    if (next.name === 'dash' || next instanceof SpellAction) return this.t >= this.info.window[0] + 0.05;
    return false;
  }
}

/** Shikai hilt swing / Bankai gesture: a petal stream follows the motion to the target. */
class SteerAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private cast = false;
  queued = false;

  constructor(readonly kit: ByakuyaKit, readonly clip: string, readonly index: number, readonly torrent = false) {
    super();
    this.name = clip;
    this.mobility = 0.35;
    this.airGravity = 0.1;
  }

  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.55;
    f.anim.play(this.clip, { onEvent: (n) => { if ((n === 'hit' || n === 'cast') && !this.cast) this.fire(f, g); } });
  }

  private fire(f: Fighter, g: Game): void {
    this.cast = true;
    const k = this.kit;
    const sw = k.swarm;
    if (!sw) return;
    const bankai = k.form === 'bankai';
    const from = bankai ? () => sock(f, this.index % 2 === 0 ? 'palm.R' : 'palm.L') : () => k.hiltTip();
    const tgt = () => aim(f, g);
    if (this.torrent) sw.stream(from, tgt, 1.7, { damage: 9, carve: [1.05, 75], knock: 2 }, 1.25, 2.3);
    else if (bankai) sw.stream(from, tgt, 0.85, { damage: 9, carve: [1.25, 85], knock: 2.5 }, 1.55, 2.1);
    else sw.stream(from, tgt, 0.62, { damage: 6, carve: [0.6, 42] }, 0.8, 1.8);
    f.aura.flare(1.2, 0.25);
  }

  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.kit.chain(this.index + 1);
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }

  override canCancel(next: FighterAction): boolean {
    return (next.name === 'dash' || next instanceof SpellAction) && this.cast;
  }
}

/** Base for specials (chains cancel into these after their hit). */
abstract class SpellAction extends FighterAction {
  protected dur = 1;
  constructor(readonly kit: ByakuyaKit) {
    super();
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= this.dur) this.done = true;
  }
}

/** Hadō #4 Byakurai: white lightning from a fingertip, thin enough to bore a tunnel. */
class ByakuraiAction extends SpellAction {
  readonly name = 'byakurai';
  constructor(kit: ByakuyaKit) {
    super(kit);
    this.mobility = 0.1;
    this.airGravity = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('by_point')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play('by_point', {
      onEvent: (n) => {
        if (n !== 'fire') return;
        const emitter = f.visual.rig.sockets.get('finger.L')!;
        g.addProjectile(new CeroBeam(g, f, emitter, () => aim(f, g), { charge: 0.04, fire: 0.28, radius: 0.13, damage: 62, power: 420, core: '#FFFFFF', body: '#9CC9FF', rim: '#4A7CC8', range: 95, track: 2.5, gain: 1.6 }));
        g.callout('白雷', 'HADŌ #4 · BYAKURAI', '#cfe6ff');
        g.sfx.play('shunpo', f.center(), 1.2);
      },
    });
  }
}

/** Hadō #33 Sōkatsui: a blast of blue fire from the palm. */
class SokatsuiAction extends SpellAction {
  readonly name = 'sokatsui';
  constructor(kit: ByakuyaKit) {
    super(kit);
    this.mobility = 0.05;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('by_sokatsui')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play('by_sokatsui', { onEvent: (n) => { if (n === 'fire') this.blast(f, g); } });
  }
  private blast(f: Fighter, g: Game): void {
    const p = sock(f, 'palm.L');
    const dir = aim(f, g).sub(p).normalize();
    g.callout('蒼火墜', 'HADŌ #33 · SŌKATSUI', '#7fc8ff');
    g.sfx.play('getsuga', p, 1);
    g.engine.destruction.carve(new ConeShape(p.clone(), dir.clone(), 0.32, 10), { mode: 'explode', power: 170, impulse: 14 });
    for (const o of g.enemiesOf(f)) {
      _v.subVectors(o.center(), p);
      const along = _v.dot(dir);
      if (along < 0 || along > 11) continue;
      const off = _v.addScaledVector(dir, -along).length();
      if (off > 1.2 + along * 0.33 + o.def.radius) continue;
      g.damage(o, 64, f, dir.clone().setY(0.25).normalize(), { knock: 13, launch: 4, heavy: true, hitstop: 0.07, shake: 0.4 });
    }
    const glow = g.engine.glow;
    for (let i = 0; i < 90; i++) {
      const spread = 0.32 * Math.random();
      const a = Math.random() * Math.PI * 2;
      const side = new THREE.Vector3(dir.z, 0, -dir.x).normalize();
      const up = new THREE.Vector3().crossVectors(side, dir);
      const d = dir.clone().addScaledVector(side, Math.cos(a) * spread).addScaledVector(up, Math.sin(a) * spread).normalize();
      const s = 10 + Math.random() * 16;
      const hot = Math.random() < 0.35;
      glow.spawn({ x: p.x, y: p.y, z: p.z, vx: d.x * s, vy: d.y * s + 1, vz: d.z * s, size: hot ? 0.5 : 0.8, sizeEnd: 0.1, life: 0.35 + Math.random() * 0.35, r: hot ? 0.81 : 0.25, g: hot ? 0.94 : 0.66, b: 1, alpha: 0.9, alphaEnd: 0, tex: Math.random() < 0.5 ? TEX_GLOW : TEX_STREAK, stretch: 2, drag: 1.5 });
    }
    f.push.addScaledVector(dir, -2.5);
  }
}

/** Senka: a flash step to the target's back and two strikes at the soul's reiryoku points. */
class SenkaAction extends SpellAction {
  readonly name = 'senka';
  private struck = 0;
  constructor(kit: ByakuyaKit, readonly target: Fighter | null) {
    super(kit);
    this.mobility = 0;
    this.invulnerable = true;
    this.dur = 0.55;
  }
  override start(f: Fighter, g: Game): void {
    f.ghosts.spawn(0.5, 1);
    g.onDash(f);
    const t = this.target;
    if (t) {
      const back = t.forward().multiplyScalar(-1.3);
      f.body.pos.set(t.pos.x + back.x, Math.max(t.pos.y, f.pos.y - 0.3), t.pos.z + back.z);
      f.body.prev.copy(f.body.pos);
      f.yaw = Math.atan2(t.pos.x - f.pos.x, t.pos.z - f.pos.z);
    }
    f.ghosts.spawn(0.5, 1);
    if (this.kit.form !== 'bankai') f.anim.play('by_slash3', { fadeIn: 0.02 });
    else f.anim.play('by_wave1', { fadeIn: 0.02 });
    g.callout('閃花', 'SENKA', '#ffffff');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.target;
    if (t && !t.dead && this.struck < 2 && this.t >= 0.08 + this.struck * 0.12) {
      this.struck++;
      const dir = t.pos.clone().sub(f.pos).setY(0).normalize();
      g.damage(t, 26, f, dir, { knock: 3, hitstop: 0.06, shake: 0.25, heavy: this.struck === 2 });
      g.sparks(t.center(), dir, '#ffffff', 14);
      if (this.struck === 2) {
        // Saketsu and Hakusui sealed: reiatsu drained, the body locks up for a moment
        t.rei = 0;
        t.hitstun = Math.max(t.hitstun, 0.9);
        g.addRing(t.center(), 3, '#ffffff', 0.35);
      }
    }
    if (this.t > 0.15) this.invulnerable = false;
  }
}

/** Petal wall (Shikai) / dome (Bankai): the blades close ranks; damage taken drops while they hold. */
class GuardAction extends SpellAction {
  readonly name = 'guard';
  constructor(kit: ByakuyaKit) {
    super(kit);
    this.mobility = 0.3;
    this.dur = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('by_raise');
    this.kit.guard(this.kit.form === 'bankai' ? 3 : 2.4);
    g.sfx.play('swing', f.center(), 0.8);
  }
}

class GokeiAction extends SpellAction {
  readonly name = 'gokei';
  constructor(kit: ByakuyaKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('by_raise')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play('by_raise', {
      onEvent: (n) => {
        if (n !== 'cast') return;
        this.kit.swarm?.sphere(this.target, 1.6, { damage: 7 });
        g.callout('吭景', 'GŌKEI', '#f5a9c4');
      },
    });
  }
}

/** Senkei: rings of glowing swords close around the target; then Ikka Senjinka — every sword flies. */
class SenkeiStrike implements Projectile {
  done = false;
  private t = 0;
  private swords: SenkeiSwords;
  private launched = false;
  private hits = 0;

  constructor(private g: Game, private owner: Fighter, private target: Fighter) {
    this.swords = new SenkeiSwords(byakuyaProp('katana'), target.pos.clone(), 4, 12, 6.5);
    g.engine.gr.scene.add(this.swords.group);
    // the swords rise out of the petals
    this.swords.group.position.y = -3;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.owner.dead) this.done = true;
    this.swords.group.position.y = Math.min(0, -3 + this.t * 6);
    if (!this.launched && this.t >= 1.6) {
      this.launched = true;
      this.swords.launch();
      g.callout('一咬千刃花', 'IKKA SENJINKA', '#ffd7e8');
      g.sfx.play('getsuga', this.target.center(), 1.4);
    }
    const tp = this.target.dead ? this.swords.center.clone().setY(this.swords.center.y + 1) : this.target.center();
    const before = this.swords.swords.filter((s) => s.state === 3).length;
    this.swords.update(dt, tp, g.engine.glow);
    const after = this.swords.swords.filter((s) => s.state === 3).length;
    for (let i = before; i < after; i++) {
      this.hits++;
      if (!this.target.dead && this.target.center().distanceTo(tp) < 3) {
        g.damage(this.target, 9, this.owner, _v.set(Math.random() - 0.5, 0.2, Math.random() - 0.5).normalize(), { knock: 1.5, quiet: true });
        this.target.hitstun = Math.max(this.target.hitstun, 0.2);
      }
      if (this.hits % 6 === 0) {
        g.engine.destruction.carve(new SphereShape(tp.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2, -0.8, (Math.random() - 0.5) * 2)), 1.2, 0.8), { mode: 'explode', power: 120, impulse: 10 });
        g.sfx.play('impact', tp, 0.9);
        g.shake(0.25);
      }
    }
    if (this.launched && this.swords.finished) {
      if (!this.target.dead) g.damage(this.target, 60, this.owner, this.target.pos.clone().sub(this.owner.pos).setY(0.3).normalize(), { knock: 16, launch: 7, heavy: true, hitstop: 0.12, shake: 0.7 });
      g.addRing(tp.clone(), 8, '#ffd7e8', 0.5);
      this.done = true;
    }
  }

  dispose(): void {
    this.swords.dispose();
  }
}

class SenkeiAction extends SpellAction {
  readonly name = 'senkei';
  constructor(kit: ByakuyaKit, readonly target: Fighter) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.5;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('by_raise')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    // Senkei costs his blood
    f.hp = Math.max(1, f.hp - f.maxHp * 0.04);
    f.anim.play('by_raise', {
      onEvent: (n) => {
        if (n !== 'cast') return;
        g.callout('殲景', 'SENKEI · SENBONZAKURA KAGEYOSHI', '#ffd7e8');
        g.addProjectile(new SenkeiStrike(g, f, this.target));
        f.aura.flare(1.8, 0.8);
      },
    });
  }
}

/** Grand wave: both arms sweep and the petal ocean flattens everything ahead. */
class GrandWaveAction extends SpellAction {
  readonly name = 'grandwave';
  constructor(kit: ByakuyaKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('by_push')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play('by_push', {
      onEvent: (n) => {
        if (n !== 'cast') return;
        const dir = aim(f, g).sub(f.center()).setY(0).normalize();
        this.kit.swarm?.sweep(f.pos.clone().addScaledVector(dir, 1.5), dir, 15, 5.5, 28, 44, { damage: 78, carve: [0, 150], knock: 18 });
        g.shake(0.5);
        f.aura.flare(1.6, 0.4);
      },
    });
  }
}

class ReleaseAction extends SpellAction {
  readonly name = 'release';
  constructor(kit: ByakuyaKit, readonly to: 'shikai' | 'bankai') {
    super(kit);
    this.invulnerable = true;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    if (this.to === 'shikai') {
      this.dur = 1.15;
      f.anim.play('by_shikai', { onEvent: (n) => { if (n === 'scatter') this.kit.becomeShikai(); } });
      g.callout('散れ 千本桜', 'CHIRE, SENBONZAKURA', '#f5a9c4');
    } else {
      this.dur = 2.3;
      f.anim.play('by_bankai', {
        onEvent: (n) => {
          if (n === 'drop') this.kit.dropSword();
          if (n === 'rise') this.kit.riseBlades();
          if (n === 'shatter') this.kit.becomeBankai();
        },
      });
      g.callout('卍解', 'BANKAI · SENBONZAKURA KAGEYOSHI', '#ffd7e8');
    }
  }
}

/** Shūkei: Hakuteiken — wings and halo of white light, then one white cut. */
class HakuteikenAction extends SpellAction {
  readonly name = 'hakuteiken';
  private cut = false;
  constructor(kit: ByakuyaKit) {
    super(kit);
    this.mobility = 0;
    this.armor = 0.8;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('by_hakuteiken')!;
    this.dur = c.dur - c.fadeOut * 0.5 + 0.5;
    this.kit.wings(true);
    g.callout('終景・白帝剣', 'SHŪKEI · HAKUTEIKEN', '#ffffff');
    g.sfx.play('bankai', f.center(), 0.8);
    f.visual.attach('sword', byakuyaProp('katana'), 'grip.R');
    f.visual.props.get('sword')!.material.userData.uniforms.uEnergy.value.set(1, 1, 1, 1);
    f.aura.flare(2.4, 1.2);
    f.anim.play('by_hakuteiken', { onEvent: (n) => { if (n === 'hit' && !this.cut) this.slash(f, g); } });
  }
  private slash(f: Fighter, g: Game): void {
    this.cut = true;
    const dir = aim(f, g).sub(f.center()).normalize();
    dir.y = Math.max(-0.1, Math.min(0.4, dir.y));
    dir.normalize();
    const right = new THREE.Vector3(dir.z, 0, -dir.x).normalize().multiplyScalar(-1);
    const side = new THREE.Vector3(0, 1, 0).multiplyScalar(Math.cos(0.5)).addScaledVector(right, Math.sin(0.5));
    g.addProjectile(new GetsugaProjectile(g, f, f.center().addScaledVector(dir, 1.2), dir, side, { radius: 6.5, halfAngle: 1.25, speed: 62, range: 120, damage: 270, cut: 1900, colors: WHITE }));
    g.shake(0.9);
    g.hitstop(0.12);
    g.slowMo(0.4, 0.3);
    g.engine.gr.chroma.offset.set(0.008, 0.008);
    if (f === g.player) g.cam.punchFov(10);
  }
  override end(f: Fighter): void {
    this.kit.wings(false);
    f.visual.detach('sword');
  }
}

// ------------------------------------------------------------------ kit

export class ByakuyaKit implements Kit {
  form: Form = 'sealed';
  comboIndex = 0;
  private lastEnd = 0;
  flare = false;
  swarm: SenbonzakuraSwarm | null = null;
  private cd = { byakurai: 0, sokatsui: 0, senka: 0, guard: 0, torrent: 0, gokei: 0, senkei: 0, grand: 0, hakuteiken: 0 };
  private guardT = 0;
  private blades: BankaiBlades | null = null;
  private bladesT = 0;
  private wingFx: WhiteWings | null = null;
  private dropped: THREE.Object3D | null = null;
  private droppedT = 0;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
  }

  update(dt: number): void {
    const f = this.f;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    if (this.guardT > 0) {
      this.guardT -= dt;
      if (this.guardT <= 0) this.applyStats();
    }
    if (this.blades) {
      this.bladesT += dt;
      this.blades.update(dt);
      if (this.bladesT > 1.6) {
        this.blades.dispose();
        this.blades = null;
      }
    }
    if (this.wingFx) {
      this.wingFx.update(dt);
      const back = f.visual.rig.sockets.get('back');
      if (back && !this.wingFx.group.parent) back.add(this.wingFx.group);
      if (this.wingFx.target === 0 && this.wingFx.level < 0.02) {
        this.wingFx.dispose();
        this.wingFx = null;
      }
    }
    if (this.dropped) {
      // the dropped sword sinks into the ground as if into water
      this.droppedT += dt;
      this.dropped.position.y -= dt * (this.droppedT < 0.15 ? 6 : 1.6);
      if (this.droppedT > 1.2) {
        this.dropped.removeFromParent();
        this.dropped = null;
      }
    }
  }

  /** Point where Shikai petals leave the hilt. */
  hiltTip(): THREE.Vector3 {
    const s = this.f.visual.props.get('sword');
    if (!s) return sock(this.f, 'grip.R');
    s.updateWorldMatrix(true, false);
    return new THREE.Vector3(0, 0, 0.14).applyMatrix4(s.matrixWorld);
  }

  private chainList(): string[] {
    return this.form === 'bankai' ? BYAKUYA_BANKAI_CHAIN : this.form === 'shikai' ? BYAKUYA_SHIKAI_CHAIN : BYAKUYA_CHAIN;
  }

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof CutAction && !cur.heavy) { cur.queued = true; return; }
    if (cur instanceof SteerAction && !cur.torrent) { cur.queued = true; return; }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.chainList();
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastEnd = this.g.time + 0.8;
    if (this.form === 'sealed') this.f.act(new CutAction(this, list[idx], idx), true);
    else this.f.act(new SteerAction(this, list[idx], idx), true);
  }

  heavy(): void {
    const f = this.f;
    if (f.busy && !(f.action instanceof CutAction || f.action instanceof SteerAction)) return;
    this.comboIndex = 0;
    if (this.form === 'sealed') f.act(new CutAction(this, 'by_cleave', 0, true), true);
    else if (this.form === 'shikai') {
      if (this.cd.torrent > 0 || !f.spendRei(12)) return;
      this.cd.torrent = 2.5;
      f.act(new SteerAction(this, 'by_hilt2', 1, true), true);
    } else this.special(new GrandWaveAction(this), 22, 'grand', 5);
  }

  private special(a: SpellAction, cost: number, key: keyof typeof this.cd, cd: number): boolean {
    const f = this.f;
    if (this.cd[key] > 0 || f.dead || f.hitstun > 0 || f.dashT > 0) return false;
    if (f.action && !f.action.canCancel(a)) return false;
    if (!f.spendRei(cost)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return false;
    }
    this.cd[key] = cd;
    f.act(a, true);
    return true;
  }

  private target(range = 60): Fighter | null {
    return this.g.nearestEnemy(this.f, range, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, range);
  }

  /** Q: Senka (sealed, Shikai) / Gōkei (Bankai). */
  skill1(): void {
    if (this.form === 'bankai') this.gokei();
    else this.senka();
  }

  /** E: Byakurai (sealed, Shikai) / Senkei → Ikka Senjinka (Bankai). */
  skill2(): void {
    if (this.form === 'bankai') this.senkei();
    else this.byakurai();
  }

  /** R: Sōkatsui (sealed) / petal wall (Shikai) / Byakurai (Bankai). */
  skill3(): void {
    if (this.form === 'sealed') this.special(new SokatsuiAction(this), 18, 'sokatsui', 3);
    else if (this.form === 'shikai') this.special(new GuardAction(this), 10, 'guard', 6);
    else this.byakurai();
  }

  senka(): void {
    const t = this.target(25);
    if (!t) return;
    this.special(new SenkaAction(this, t), 14, 'senka', 5);
  }

  byakurai(): void {
    this.special(new ByakuraiAction(this), 10, 'byakurai', 1.4);
  }

  gokei(): void {
    const t = this.target(40);
    if (!t || !this.swarm) return;
    this.special(new GokeiAction(this, t), 25, 'gokei', 7);
  }

  senkei(): void {
    const t = this.target(40);
    if (!t) return;
    this.special(new SenkeiAction(this, t), 40, 'senkei', 14);
  }

  /** G: Shūkei: Hakuteiken (Bankai only). */
  toggle(): void {
    if (this.form !== 'bankai') return;
    this.special(new HakuteikenAction(this), 55, 'hakuteiken', 22);
  }

  release(): void {
    const f = this.f;
    if (f.busy || this.form === 'bankai') return;
    const to = this.form === 'sealed' ? 'shikai' : 'bankai';
    if (!f.spendRei(to === 'shikai' ? 20 : 40)) {
      if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new ReleaseAction(this, to), true);
  }

  toggleFlare(): void {
    this.flare = !this.flare;
    this.applyStats();
    if (this.flare) {
      this.f.aura.flare(1.6, 0.4);
      this.g.sfx.play('flare', this.f.center());
      // petal flare: the swarm bursts outward for a moment
      this.swarm?.dome(0.6);
    }
  }

  guard(dur: number): void {
    const f = this.f;
    if (!this.swarm) return;
    if (this.form === 'bankai') this.swarm.dome(dur);
    else this.swarm.wall(f.forward(), dur);
    this.guardT = dur;
    this.applyStats();
  }

  /** The heavy's split: a thin cut through the world in the plane of the chop, a beat later. */
  bifurcate(f: Fighter, g: Game): void {
    const fw = f.forward();
    const c = f.center().addScaledVector(fw, 5.5);
    const right = new THREE.Vector3(-fw.z, 0, fw.x);
    _m.makeBasis(right, new THREE.Vector3(0, 1, 0), fw);
    _q.setFromRotationMatrix(_m);
    g.engine.destruction.carve(new BoxShape(c, new THREE.Vector3(0.06, 3, 5.2), _q.clone()), { mode: 'cut', power: 700, dir: right, sparks: [0.9, 0.95, 1], dust: 0.4 });
    for (const o of g.enemiesOf(f)) {
      _v.subVectors(o.pos, f.pos);
      const along = _v.dot(fw), across = Math.abs(_v.dot(right));
      if (along > 0.5 && along < 11 && across < 0.6 + o.def.radius) g.damage(o, 30, f, fw, { knock: 6, heavy: true, hitstop: 0.06 });
    }
    g.sfx.play('swingHeavy', c, 1.2);
    const glow = g.engine.glow;
    for (let i = 0; i < 24; i++) {
      const p = f.center().addScaledVector(fw, 1 + i * 0.45);
      glow.spawn({ x: p.x, y: p.y + (Math.random() - 0.5) * 3, z: p.z, size: 0.25, sizeEnd: 0.02, life: 0.3, r: 1, g: 1, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
    }
  }

  /** "Chire": the blade scatters into the petals; he keeps the hilt. */
  becomeShikai(): void {
    const { f, g } = this;
    if (this.form !== 'sealed') return;
    this.form = 'shikai';
    const blade = f.visual.props.get('sword');
    const base = new THREE.Vector3(), tip = new THREE.Vector3();
    if (blade) {
      blade.updateWorldMatrix(true, false);
      base.set(0, 0, 0.14).applyMatrix4(blade.matrixWorld);
      tip.set(0, 0, 0.99).applyMatrix4(blade.matrixWorld);
    } else base.copy(f.center());
    f.visual.attach('sword', byakuyaProp('hilt'), 'grip.R');
    this.swarm = new SenbonzakuraSwarm(g, f, 1000, (_i, out) => out.lerpVectors(base, tip.lengthSq() ? tip : base, Math.random()));
    g.addProjectile(this.swarm);
    f.aura.flare(1.8, 0.6);
    g.sfx.play('flare', f.center());
    this.applyStats();
  }

  dropSword(): void {
    const f = this.f;
    const s = f.visual.props.get('sword');
    if (!s) return;
    s.updateWorldMatrix(true, false);
    const p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
    s.matrixWorld.decompose(p, q, sc);
    f.visual.detach('sword');
    // the hilt falls point-first into the ground, which ripples like water
    const fallen = s;
    fallen.position.copy(p);
    fallen.quaternion.copy(q);
    this.g.engine.gr.scene.add(fallen);
    this.dropped = fallen;
    this.droppedT = 0;
    this.g.addRing(f.pos.clone().addScaledVector(f.forward(), 0.4).setY(f.pos.y + 0.05), 5, '#f5a9c4', 0.9);
    this.g.sfx.play('airstep', f.pos, 1.5);
  }

  riseBlades(): void {
    const { f, g } = this;
    this.blades = new BankaiBlades(byakuyaProp('giant'), f.pos.clone(), f.yaw, 1, 8);
    this.bladesT = 0;
    g.engine.gr.scene.add(this.blades.group);
    g.shake(0.5);
    g.sfx.play('impact', f.pos, 1.4);
    // the landscape darkens around him
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.dust.spawn({ x: f.pos.x, y: f.pos.y + 0.2, z: f.pos.z, vx: Math.cos(a) * 9, vy: 0.6, vz: Math.sin(a) * 9, size: 0.8, sizeEnd: 3, life: 1.2, r: 0.2, g: 0.18, b: 0.22, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    }
  }

  /** The giant blades shatter into the petal ocean. */
  becomeBankai(): void {
    const { f, g } = this;
    if (this.form === 'bankai') return;
    this.form = 'bankai';
    f.anim.loco.stance = BYAKUYA_BANKAI_STANCE;
    f.def = { ...f.def, stance: BYAKUYA_BANKAI_STANCE };
    const blades = this.blades;
    if (!this.swarm) {
      this.swarm = new SenbonzakuraSwarm(g, f, 0);
      g.addProjectile(this.swarm);
    }
    this.swarm.swarm.setCount(3400, (i, out) => (blades ? blades.sample(i, out) : out.copy(f.center())));
    if (blades) {
      blades.dispose();
      this.blades = null;
    }
    this.swarm.orbit();
    f.aura.pillarBurst(2.2);
    f.aura.flare(1.8, 0.7);
    g.sfx.play('bankai', f.center());
    g.shake(0.9);
    g.slowMo(0.45, 0.35);
    g.engine.gr.chroma.offset.set(0.007, 0.007);
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d < 12) g.damage(o, 30 * (1 - d / 12), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 18 * (1 - d / 12), launch: 5, heavy: true });
    }
    this.applyStats();
  }

  wings(on: boolean): void {
    if (on) {
      if (!this.wingFx) this.wingFx = new WhiteWings();
      this.wingFx.target = 1;
    } else if (this.wingFx) this.wingFx.target = 0;
  }

  private applyStats(): void {
    const f = this.f;
    f.power = (this.form === 'bankai' ? 1.4 : this.form === 'shikai' ? 1.15 : 1) * (this.flare ? 1.3 : 1);
    f.damageTaken = this.guardT > 0 ? 0.25 : 1;
    f.aura.target = this.flare ? 0.8 : this.form === 'bankai' ? 0.22 : 0.14;
  }

  formName(): string {
    return this.form === 'bankai' ? 'Bankai — Senbonzakura Kageyoshi' : this.form === 'shikai' ? 'Shikai — Senbonzakura' : 'Captain, 6th Division';
  }

  ai(): KitAI {
    return {
      reach: 2.4,
      chain: 3,
      releaseAt: [0.85, 0.5],
      toggleAt: 0.35,
      toggleOn: () => this.form !== 'bankai' || this.cd.hakuteiken > 0,
      ranged: () => this.form !== 'sealed',
      moves: [
        { name: 'byakurai', use: () => this.byakurai(), min: 6, max: 55, weight: 1.6, cd: 4 },
        { name: 'senka', use: () => this.senka(), min: 3, max: 18, weight: 1.2, cd: 8, when: () => this.form !== 'bankai' },
        { name: 'sokatsui', use: () => this.skill3(), min: 2, max: 10, weight: 1.2, cd: 6, when: () => this.form === 'sealed' },
        { name: 'stream', use: () => this.attack(), min: 3, max: 30, weight: 3.2, cd: 0.9, when: () => this.form !== 'sealed' },
        { name: 'torrent', use: () => this.heavy(), min: 5, max: 28, weight: 1.5, cd: 4, when: () => this.form === 'shikai' },
        { name: 'wall', use: () => this.skill3(), min: 0, max: 8, weight: 0.8, cd: 9, when: () => this.form === 'shikai' },
        { name: 'gokei', use: () => this.gokei(), min: 3, max: 32, weight: 1.6, cd: 9, when: () => this.form === 'bankai' },
        { name: 'senkei', use: () => this.senkei(), min: 3, max: 32, weight: 1, cd: 16, when: () => this.form === 'bankai' },
        { name: 'grand', use: () => this.heavy(), min: 5, max: 36, weight: 1.4, cd: 7, when: () => this.form === 'bankai' },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const fm = this.form;
    const list: AbilityInfo[] = [
      { key: 'LMB', name: fm === 'sealed' ? 'Zanjutsu' : fm === 'shikai' ? 'Petals' : 'Waves', kanji: fm === 'sealed' ? '斬' : '桜' },
      fm === 'sealed' ? { key: 'RMB', name: 'Bifurcate', kanji: '断' } : fm === 'shikai' ? { key: 'RMB', name: 'Torrent', kanji: '奔流', cost: 12, cd: this.cd.torrent, cdMax: 2.5 } : { key: 'RMB', name: 'Grand wave', kanji: '大波', cost: 22, cd: this.cd.grand, cdMax: 5 },
      fm === 'bankai' ? { key: 'Q', name: 'Gōkei', kanji: '吭景', cost: 25, cd: this.cd.gokei, cdMax: 7 } : { key: 'Q', name: 'Senka', kanji: '閃花', cost: 14, cd: this.cd.senka, cdMax: 5 },
      fm === 'bankai' ? { key: 'E', name: 'Senkei', kanji: '殲景', cost: 40, cd: this.cd.senkei, cdMax: 14 } : { key: 'E', name: 'Byakurai', kanji: '白雷', cost: 10, cd: this.cd.byakurai, cdMax: 1.4 },
      fm === 'sealed' ? { key: 'R', name: 'Sōkatsui', kanji: '蒼火', cost: 18, cd: this.cd.sokatsui, cdMax: 3 } : fm === 'shikai' ? { key: 'R', name: 'Wall', kanji: '壁', cost: 10, cd: this.cd.guard, cdMax: 6, active: this.guardT > 0 } : { key: 'R', name: 'Byakurai', kanji: '白雷', cost: 10, cd: this.cd.byakurai, cdMax: 1.4 },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
      { key: 'F', name: fm === 'sealed' ? 'Shikai' : 'Bankai', kanji: fm === 'sealed' ? '始解' : '卍解', cost: fm === 'sealed' ? 20 : 40, active: fm === 'bankai', tint: '#f5a9c4' },
    ];
    if (fm === 'bankai') list.push({ key: 'G', name: 'Hakuteiken', kanji: '白帝', cost: 55, cd: this.cd.hakuteiken, cdMax: 22, tint: '#ffffff' });
    return list;
  }
}
