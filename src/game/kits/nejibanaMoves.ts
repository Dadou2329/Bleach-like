// Nejibana's moves (docs/kits/kaien.md, docs/kits/aaroniero.md), shared by Kaien Shiba and by Aaroniero wearing his
// face: the fencer's cuts with the sealed sword, Shakkahō, "Suiten sakamake, Nejibana", the spear dance shedding water
// arcs (the 4th crushing blow raising a wave all round), the crushing tide, the rising wave, the spiral thrust.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter } from '../fighter';
import type { Game } from '../game';
import { WaveWall } from '../../vfx/glotoneria';
import { splash, Torrent, WaterBlade, WaterSpray } from '../../vfx/water';
import { Shakkaho } from '../projectiles/shakkaho';
import { TEX_GLOW } from '../../vfx/sprites';

export const WATER = '#3AA6E6';

/** what Nejibana's moves need from the kit that swings them */
export interface NejibanaHost {
  readonly f: Fighter;
  readonly g: Game;
  /** where a shot from `from` should go (the target, or the crosshair) */
  aim(from: THREE.Vector3, out?: THREE.Vector3): THREE.Vector3;
  target(range?: number): Fighter | null;
  /** the next blow of the string */
  chain(i: number): void;
  /** the release is done: the sword is the trident now */
  onNejibana(): void;
}

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

export const spec = (damage: number, knock: number, cut: number, extra: Partial<BladeSpec> = {}): BladeSpec => ({ damage, knock, launch: 0, hitstop: 0.05, shake: 0.12, cut, ...extra });

/** blade windows (clip time) of each Kaien / Nejibana move; `arc`: the water arc shed by the swing (its plane) */
export const NEJIBANA_MOVES: Record<string, { clip: string; at: [number, number]; spec: BladeSpec; lunge: number; cap?: number; arc?: 'up' | 'flat' | 'slant' }> = {
  kn_s1: { clip: 'kn_s1', at: [0.1, 0.22], spec: spec(22, 6, 300, { reach: 0.14 }), lunge: 6 },
  kn_s2: { clip: 'kn_s2', at: [0.1, 0.22], spec: spec(20, 5, 300, { reach: 0.14 }), lunge: 5 },
  kn_s3: { clip: 'kn_s3', at: [0.1, 0.23], spec: spec(22, 4, 320, { launch: 7, reach: 0.14 }), lunge: 5 },
  kn_s4: { clip: 'kn_s4', at: [0.16, 0.31], spec: spec(30, 12, 420, { heavy: true, hitstop: 0.08, shake: 0.22, reach: 0.16 }), lunge: 8 },
  kn_thrust: { clip: 'kn_s4', at: [0.16, 0.31], spec: spec(34, 16, 460, { heavy: true, hitstop: 0.09, shake: 0.26, reach: 0.2 }), lunge: 16, cap: 26 },
  nj_s1: { clip: 'nj_s1', at: [0.12, 0.26], spec: spec(30, 8, 340, { reach: 0.24 }), lunge: 7, arc: 'up' },
  nj_s2: { clip: 'nj_s2', at: [0.1, 0.42], spec: spec(28, 9, 340, { reach: 0.22 }), lunge: 4, arc: 'flat' },
  nj_s3: { clip: 'nj_s3', at: [0.1, 0.26], spec: spec(30, 4, 340, { launch: 8, reach: 0.22 }), lunge: 5, arc: 'slant' },
  nj_s4: { clip: 'nj_s4', at: [0.3, 0.45], spec: spec(44, 14, 520, { heavy: true, hitstop: 0.1, shake: 0.32, reach: 0.24 }), lunge: 6, arc: 'up' },
};

/** Marker for the skills a string can cancel into. */
export abstract class SkillAction extends FighterAction {
  protected dur = 1;
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= this.dur) this.done = true;
  }
}


/** "Suiten sakamake, Nejibana": the sword held upside down and twirled; it becomes the trident in a burst of water. */
export class NejibanaReleaseAction extends SkillAction {
  readonly name = 'nejibana';
  private done1 = false;
  constructor(readonly kit: NejibanaHost) {
    super();
    this.mobility = 0.1;
    this.trackTarget = false;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('kn_release')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play('kn_release', {
      onEvent: (n) => {
        if (n === 'name') g.callout('水天逆巻け「捩花」', 'SUITEN SAKAMAKE, NEJIBANA', '#7fd0ff');
        if (n === 'twirl') g.sfx.play('torrent', f.center(), 0.6);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // water winding up the blade while it turns
    if (this.t > 0.4 && this.t < 1.0) {
      const p = sock(f, 'grip.R');
      const sp = WaterSpray.of(g);
      for (let i = 0; i < 3; i++) {
        const a = this.t * 18 + i * 2.1;
        sp.spawn(p.x + Math.cos(a) * 0.4, p.y + Math.random() * 0.6, p.z + Math.sin(a) * 0.4, Math.cos(a) * 2, 1 + Math.random() * 2, Math.sin(a) * 2, 0.05 + Math.random() * 0.04, 0.6, 0.6);
      }
    }
    if (!this.done1 && this.t >= 1.0) {
      this.done1 = true;
      this.kit.onNejibana();
      const c = f.center();
      splash(g, c, 1.6);
      g.engine.glow.spawn({ x: c.x, y: c.y + 0.4, z: c.z, size: 0.8, sizeEnd: 3.6, life: 0.5, r: 1, g: 0.89, b: 0.36, alpha: 0.85, alphaEnd: 0, tex: TEX_GLOW });
      f.aura.flare(1.5, 0.5);
    }
  }
}


/** One cut or spear stroke: the step in, the blade window, the water arc, the chain on input. */
export class CutAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private opened = false;
  private arced = false;
  queued = false;
  private readonly m: (typeof NEJIBANA_MOVES)[string];
  constructor(readonly kit: NejibanaHost | null, readonly move: string, readonly index: number) {
    super();
    this.m = NEJIBANA_MOVES[move];
    this.name = move;
    this.mobility = 0.12;
    this.airGravity = 0.12;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.m.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    f.bladeHits.clear();
    const tgt = f.faceTarget;
    const gap = tgt ? Math.max(0, Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z) - (this.m.arc ? 2.2 : 1.5)) : 0;
    f.push.addScaledVector(f.forward(_v), Math.min(this.m.lunge + gap * (this.m.cap ? 4 : 3), this.m.cap ?? 15));
    f.anim.play(this.m.clip, { onEvent: (n) => n === 'step' && g.sfx.play('step', f.pos, 0.4) });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    const m = this.m;
    if (!this.opened && t >= m.at[0] - 0.03) {
      this.opened = true;
      f.bladeHits.clear();
      f.bladeSpec = m.spec;
      g.sfx.play(m.spec.heavy ? 'swingHeavy' : 'swing', f.center(), 0.8);
    }
    f.bladeActive = t >= m.at[0] && t <= m.at[1];
    if (f.trail) f.trail.emitting = t >= m.at[0] - 0.03 && t <= m.at[1] + 0.02;
    // Nejibana: every swing sheds an arc of water
    if (m.arc && !this.arced && t >= (m.at[0] + m.at[1]) / 2) {
      this.arced = true;
      if (this.kit) waterArc(this.kit, m.arc, this.move === 'nj_s4');
    }
    if (this.queued && t >= this.comboAt && this.kit) {
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
    const w = this.m.at[1];
    if (next.name === 'dash') return this.t >= w;
    return next instanceof SkillAction && this.t >= w + 0.03;
  }
}

/** Shakkahō from the left palm (n: one, or the rapid three). */
export class ShakkahoAction extends SkillAction {
  readonly name: string;
  private fired = 0;
  private times: number[] = [];
  constructor(readonly kit: NejibanaHost, readonly n: number) {
    super();
    this.name = n > 1 ? 'rapid' : 'shakkaho';
    this.mobility = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('kn_shakkaho')!;
    const at = c.events.fire ?? 0.24;
    for (let i = 0; i < this.n; i++) this.times.push(at + i * 0.3);
    this.dur = c.dur - c.fadeOut * 0.5 + (this.n - 1) * 0.3;
    f.anim.play('kn_shakkaho');
    g.callout('赤火砲', this.n > 1 ? 'HADŌ #31 · SHAKKAHŌ ×3' : 'HADŌ #31 · SHAKKAHŌ', '#ff7a4a');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    while (this.fired < this.n && this.t >= this.times[this.fired]) {
      this.fired++;
      if (this.fired > 1) f.anim.play('kn_shakkaho', { fadeIn: 0.04 });
      const from = sock(f, 'palm.L');
      from.addScaledVector(f.forward(_v), 0.3);
      const dir = this.kit.aim(from).sub(from).normalize();
      g.addProjectile(new Shakkaho(f, g, from, dir, { damage: this.n > 1 ? 22 : 30, speed: 30, size: 0.3, blast: 1.3, range: 40 }));
      g.sfx.play('charge', from, 0.4);
    }
  }
}

/** The crushing tide: a thrust that pins (the weapon flicked from its hand), then the wave behind slams it onto the spear. */
export class TideAction extends SkillAction {
  readonly name = 'tide';
  private opened = false;
  private waved = false;
  private pinned: Fighter | null = null;
  private pinT = 0;
  constructor(readonly kit: NejibanaHost) {
    super();
    this.mobility = 0.08;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('nj_tide')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.bladeHits.clear();
    const tgt = f.faceTarget;
    const gap = tgt ? Math.max(0, Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z) - 2.4) : 0;
    f.push.addScaledVector(f.forward(_v), Math.min(7 + gap * 3, 15));
    f.anim.play('nj_tide');
    g.sfx.play('swingHeavy', f.center(), 0.8);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    if (!this.opened && t >= 0.11) {
      this.opened = true;
      f.bladeHits.clear();
      f.bladeSpec = spec(40, 2, 360, {
        heavy: true, reach: 0.26, hitstop: 0.08, shake: 0.24,
        onHit: (o) => {
          // pinned on the spear, the weapon flicked from its hand
          this.pinned = o;
          this.pinT = 0.6;
          o.disarmT = Math.max(o.disarmT, 2);
        },
      });
    }
    f.bladeActive = t >= 0.14 && t <= 0.3;
    if (f.trail) f.trail.emitting = f.bladeActive;
    const o = this.pinned;
    if (o && this.pinT > 0) {
      this.pinT -= dt;
      o.hitstun = Math.max(o.hitstun, 0.2);
      o.push.set(0, 0, 0);
      o.body.vel.x = o.body.vel.z = 0;
    }
    if (!this.waved && t >= 0.4) {
      this.waved = true;
      const tgt = o && !o.dead ? o : this.kit.target(8);
      if (tgt) {
        // the wave rises behind the target and rolls toward the spear
        const away = _w.subVectors(tgt.pos, f.pos).setY(0);
        if (away.lengthSq() < 0.01) f.forward(away);
        away.normalize();
        const from = tgt.pos.clone().addScaledVector(away, 2.6);
        g.addProjectile(new WaveWall(g, f, from, away.clone().negate(), 5, 2.8, 0.7, 50, 2.6));
        g.sfx.play('torrent', from, 0.9);
      }
    }
  }
  override end(f: Fighter): void {
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }
}

/** The rising wave: the spear driven into the ground ahead — the floor torn up, a wall of water lifting whoever it meets. */
export class WaveAction extends SkillAction {
  readonly name = 'wave';
  private driven = false;
  private at = 0.36;
  constructor(readonly kit: NejibanaHost) {
    super();
    this.mobility = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('nj_wave')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.at = c.events.drive ?? 0.36;
    f.anim.play('nj_wave');
    void g;
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.driven || this.t < this.at) return;
    this.driven = true;
    const fw = f.forward(_v).setY(0).normalize().clone();
    const p = f.pos.clone().addScaledVector(fw, 1.8);
    g.groundImpact(p, 1.1, 150, WATER, f);
    g.addProjectile(new WaveWall(g, f, p, fw, 8, 3, 0.8, 25, 6));
    splash(g, p.clone().setY(p.y + 0.3), 1.6, fw);
  }
}

/** The spiral thrust: a long lunge, a corkscrew jet of water bored out of the trident's head. */
export class SpiralAction extends SkillAction {
  readonly name = 'spiral';
  private fired = false;
  private at = 0.3;
  constructor(readonly kit: NejibanaHost) {
    super();
    this.mobility = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('nj_spiral')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.at = c.events.fire ?? 0.3;
    f.push.addScaledVector(f.forward(_v), 8);
    f.anim.play('nj_spiral');
    g.sfx.play('charge', f.center(), 0.5);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.fired || this.t < this.at) return;
    this.fired = true;
    const tip = () => f.blade.tip.clone();
    const dir = this.kit.aim(tip()).sub(tip()).normalize();
    g.addProjectile(new Torrent(g, f, tip, dir, { len: 20, r0: 0.25, r1: 1.1, dur: 0.55, dps: 130, power: 260, speed: 70 }));
    g.sfx.play('torrent', tip(), 1.1);
  }
}

/** the arc of water shed by a Nejibana swing; the 4th raises a wave all round where it lands */
export function waterArc(host: NejibanaHost, plane: 'up' | 'flat' | 'slant', ring: boolean): void {
  const { f, g } = host;
  const fw = f.forward(new THREE.Vector3()).setY(0).normalize();
  const right = new THREE.Vector3(fw.z, 0, -fw.x);
  const side = plane === 'up' ? UP.clone() : plane === 'flat' ? right : right.clone().add(UP).normalize();
  const from = f.center().addScaledVector(fw, 0.9);
  const dir = host.aim(from).sub(from).normalize();
  g.addProjectile(new WaterBlade(g, f, from, dir, side, 18, 1.5, 8, 200));
  if (!ring) return;
  const at = f.pos.clone().addScaledVector(fw, 2.2);
  g.addRing(at.clone().setY(at.y + 0.2), 6, WATER, 0.5);
  splash(g, at.clone().setY(at.y + 0.3), 2, fw);
  const sp = WaterSpray.of(g);
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    sp.spawn(at.x + Math.cos(a) * 1.5, at.y + 0.3, at.z + Math.sin(a) * 1.5, Math.cos(a) * 9, 4 + Math.random() * 4, Math.sin(a) * 9, 0.08 + Math.random() * 0.06, 0.9, Math.random());
  }
  for (const o of g.enemiesOf(f)) {
    if (o.pos.distanceTo(at) > 6 + o.def.radius) continue;
    g.damage(o, 30, f, _w.subVectors(o.pos, at).setY(0).normalize().clone(), { energy: true, knock: 10, launch: 9, hitstop: 0.06, shake: 0.3 });
    o.wetT = Math.max(o.wetT, 6);
  }
}
