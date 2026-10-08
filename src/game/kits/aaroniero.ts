// Aaroniero Arruruerie's kit (docs/kits/aaroniero.md). A Gillian wearing a dead man's face. Masked, the light cannot
// touch him: the gloved hand opens on Glotonería's maw (bites, a lash, the maw slammed down), the devouring grab that
// eats the fallen and the failing (every Hollow eaten makes him stronger), Spirit Body Fusion's red tentacles hooking
// into a soul, the back armed to shatter the next sword that touches it. In shadow he is Kaien Shiba — the fencer, the
// Shakkahō, "Suiten sakamake, Nejibana": the spear dance shedding water, the crushing tide, the rising wave, the
// spiral thrust. Sunlight (a ray toward the sun that meets nothing) melts Kaien off him and bares the glass capsule
// with the two little heads (hits on it ×3). "Kuitsukuse, Glotonería": every eaten Hollow at once — tentacles that
// slam and sweep, the horde out of the pool, the swallow, the army of 33,650.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { DamageOpts, Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import type { AuraStyle } from '../../vfx/aura';
import { aaronieroAsset, aaronieroProp, CAPSULE, GLOT_LIFT, KATANA_BASE_Z, KATANA_TIP_Z, MASS_W, NEJIBANA_BASE_Z, NEJIBANA_TIP_Z, type AaronieroHead, type AaronieroProp } from '../../chars/aaroniero';
import { AARONIERO_CHAIN, AARONIERO_CLIPS, AARONIERO_STANCE, GLOT_CHAIN, GLOT_CLIPS, GLOT_STANCE, KAIEN_CHAIN, KAIEN_CLIPS, KAIEN_STANCE, NEJIBANA_CHAIN, NEJIBANA_CLIPS, NEJIBANA_STANCE } from '../../chars/aaronieroClips';
import { PropMesh } from '../characterFactory';
import { raycastVoxels } from '../../voxel/raycast';
import { bladeShatter, CapsuleGlass, fusionLash, FusionTendril, GLOT_PURPLE, poolBoil, slamCrater, slough, TentacleStrike, WaveWall } from '../../vfx/glotoneria';
import { splash, Torrent, WaterBlade, WaterSpray } from '../../vfx/water';
import { Shakkaho } from '../projectiles/shakkaho';
import { CeroBeam } from '../projectiles/cero';
import { hollowDef, HollowAI } from '../ai/hollow';
import { groundAt } from '../../vfx/iceArts';
import { TEX_GLOW, TEX_PUFF } from '../../vfx/sprites';

export const AURA_AARONIERO: AuraStyle = { core: '#D9C2F0', body: '#4A1E6E', rim: '#1E0A30' };
const AURA_GLOT: AuraStyle = GLOT_PURPLE;

type Blade = NonNullable<FighterDef['blade']>;
const KATANA: Blade = { prop: 'sword', base: [0, 0, KATANA_BASE_Z], tip: [0, 0, KATANA_TIP_Z], color: '#8A5AC0', core: '#F1E6FF' };
const TRIDENT: Blade = { prop: 'spear', base: [0, 0, NEJIBANA_BASE_Z - 0.12], tip: [0, 0, NEJIBANA_TIP_Z], color: '#3AA6E6', core: '#E9F8FF' };

/** expert Sonído */
const SPEED_TRUE = { run: 9, sprint: 22, jump: 12, dash: 15, dashTime: 0.1 };
/** Kaien's feet: a Shunpo-fast Sonído */
const SPEED_KAIEN = { run: 9.5, sprint: 23, jump: 12.5, dash: 15.5, dashTime: 0.1 };
/** the mass: a slow crawl; Shift the tentacle surge */
const SPEED_GLOT = { run: 3.2, sprint: 5.5, jump: 0, dash: 11, dashTime: 0.32 };

/** those who fought beside Kaien hear his voice and hesitate */
const KAIEN_FRIENDS = new Set(['rukia', 'ukitake']);
const WATER = '#3AA6E6';

export const AARONIERO_DEF: FighterDef = {
  id: 'aaroniero',
  name: 'Aaroniero Arruruerie',
  title: 'Noveno Espada',
  build: () => ({
    asset: aaronieroAsset('sealed'),
    props: [
      { key: 'head', model: aaronieroProp('mask'), socket: 'skull' },
      { key: 'saya', model: aaronieroProp('sheath'), socket: 'hip.L' },
    ],
  }),
  stance: AARONIERO_STANCE,
  clips: AARONIERO_CLIPS,
  aura: AURA_AARONIERO,
  blade: KATANA,
  hp: 1050,
  rei: 220,
  speed: { ...SPEED_TRUE },
  radius: 0.42,
  height: 2.2,
};

type Form = 'true' | 'kaien' | 'nejibana' | 'glot';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _u = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
const FWD = new THREE.Vector3(0, 0, 1);

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

/** distance from p to the surface of o's hurt capsule */
function capsuleGap(o: Fighter, p: THREE.Vector3): number {
  const cy = Math.max(o.pos.y + 0.2, Math.min(o.pos.y + o.def.height - 0.2, p.y));
  return Math.hypot(o.pos.x - p.x, cy - p.y, o.pos.z - p.z) - o.def.radius;
}

/** sunlight on p: a ray toward the sun that meets nothing for 32 m (roofs, walls, the shade of buildings stop it) */
export function sunlit(g: Game, p: THREE.Vector3): boolean {
  const d = g.engine.gr.atmo.sunDir;
  if (d.y <= 0.02) return false;
  return !raycastVoxels(g.engine.world, p.x, p.y, p.z, d.x, d.y, d.z, 32);
}

/** a lesser Hollow (what he eats whole) */
function isHollow(o: Fighter): boolean {
  return o.def.id === 'hollow' || o.def.id === 'menos';
}

const spec = (damage: number, knock: number, cut: number, extra: Partial<BladeSpec> = {}): BladeSpec => ({ damage, knock, launch: 0, hitstop: 0.05, shake: 0.12, cut, ...extra });

/** blade windows (clip time) of each Kaien / Nejibana move; `arc`: the water arc shed by the swing (its plane) */
const MOVES: Record<string, { clip: string; at: [number, number]; spec: BladeSpec; lunge: number; cap?: number; arc?: 'up' | 'flat' | 'slant' }> = {
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
abstract class SkillAction extends FighterAction {
  protected dur = 1;
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= this.dur) this.done = true;
  }
}

// ------------------------------------------------------------------------------------------------ the true form

interface Blow {
  by: 'maw' | 'R';
  dmg: number;
  knock: number;
  launch?: number;
  heavy?: boolean;
  /** strike radius (m) and how far in front it lands */
  r: number;
  reach: number;
  lunge: number;
  /** the maw slammed down: a crater */
  smash?: number;
}

const BLOWS: Record<string, Blow> = {
  ar_s1: { by: 'maw', dmg: 26, knock: 6, r: 0.8, reach: 1.6, lunge: 6 },
  ar_s2: { by: 'R', dmg: 18, knock: 5, r: 0.7, reach: 1.3, lunge: 4 },
  ar_s3: { by: 'maw', dmg: 22, knock: 8, launch: 3, r: 0.9, reach: 1.5, lunge: 4 },
  ar_s4: { by: 'maw', dmg: 36, knock: 12, launch: 6, heavy: true, r: 1.15, reach: 1.4, lunge: 6, smash: 120 },
};

/** One blow of the maw-hand string: lunge, land at the 'hit' event, chain on input. */
class BlowAction extends FighterAction {
  readonly name: string;
  private spec: Blow;
  private dur = 0;
  private comboAt = 0;
  private hitAt = 0;
  private struck = false;
  queued = false;
  constructor(readonly kit: AaronieroKit, readonly clip: string, readonly index: number) {
    super();
    this.name = clip;
    this.spec = BLOWS[clip];
    this.mobility = 0.12;
    this.airGravity = 0.25;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    this.hitAt = c.events.hit ?? this.dur * 0.4;
    if (this.spec.by === 'maw') this.kit.showMaw(this.dur + 0.6);
    f.anim.play(this.clip);
    const tgt = f.faceTarget;
    const gap = tgt ? Math.max(0, Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z) - 1.5) : 0;
    f.push.addScaledVector(f.forward(_v), Math.min(this.spec.lunge + gap * 2.5, 13));
    g.sfx.play(this.spec.heavy ? 'swingHeavy' : 'swing', f.center(), 0.8);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.struck && this.t >= this.hitAt) {
      this.struck = true;
      const s = this.spec;
      const p = f.pos.clone().addScaledVector(f.forward(_v), s.reach).setY(f.pos.y + (s.smash ? 0.6 : 1.25));
      let hit = false;
      for (const o of g.enemiesOf(f)) {
        if (capsuleGap(o, p) > s.r) continue;
        hit = true;
        const dir = _w.subVectors(o.pos, f.pos).setY(0).normalize().clone();
        g.damage(o, s.dmg, f, dir, { knock: s.knock, launch: s.launch, heavy: s.heavy, hitstop: s.heavy ? 0.09 : 0.05, shake: s.heavy ? 0.3 : 0.14 });
        g.sparks(o.center(), dir, s.by === 'maw' ? '#7A1A2E' : AURA_AARONIERO.body, 10);
      }
      if (s.smash) {
        g.groundImpact(p.clone().setY(f.pos.y), 1.1, s.smash, AURA_AARONIERO.body, f);
        g.shake(f === g.player ? 0.25 : 0.1);
      } else if (!hit) g.sfx.play('swing', p, 0.4);
    }
    if (this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.kit.chain(this.index + 1);
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }
  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash' || next instanceof SkillAction) return this.t >= this.hitAt + 0.04;
    return false;
  }
}

/** The devouring grab: the maw thrust out; the fallen or the failing is seized and eaten. */
class DevourAction extends SkillAction {
  readonly name = 'devour';
  private victim: Fighter | null = null;
  private grabbed = false;
  private chewed = false;
  private grabAt = 0.2;
  private chewAt = 0.5;
  constructor(readonly kit: AaronieroKit) {
    super();
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('ar_devour')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.grabAt = c.events.grab ?? 0.2;
    this.chewAt = (c.events.chew ?? 0.5) + 0.3;
    this.kit.showMaw(this.dur + 0.6);
    f.anim.play('ar_devour');
    f.push.addScaledVector(f.forward(_v), 7);
    g.sfx.play('swingHeavy', f.center(), 0.7);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.grabbed && this.t >= this.grabAt) {
      this.grabbed = true;
      const mouth = f.pos.clone().addScaledVector(f.forward(_v), 1.3).setY(f.pos.y + 1.2);
      let best: Fighter | null = null, bd = 3.2;
      for (const o of g.enemiesOf(f)) {
        const d = capsuleGap(o, mouth);
        if (d < bd) { bd = d; best = o; }
      }
      if (best && (isHollow(best) || best.hp / best.maxHp < 0.3)) {
        this.victim = best;
        best.stopAction();
        g.sfx.play('hitHeavy', best.center(), 0.8);
      } else if (best && bd < 1.2) {
        // not weak enough to eat: a bite
        g.damage(best, 40, f, _w.subVectors(best.pos, f.pos).setY(0).normalize().clone(), { knock: 8, heavy: true, hitstop: 0.08 });
        g.sparks(best.center(), f.forward(_v), '#7A1A2E', 10);
      }
    }
    const o = this.victim;
    if (o && !this.chewed) {
      if (o.dead || !g.fighters.includes(o)) {
        this.victim = null;
        return;
      }
      // held in the maw
      const m = sock(f, 'maw', _u);
      o.body.pos.set(m.x, m.y - o.def.height * 0.5, m.z);
      o.body.prev.copy(o.body.pos);
      o.body.vel.set(0, 0, 0);
      o.hitstun = Math.max(o.hitstun, 0.2);
      if (Math.random() < dt * 20) g.engine.dust.spawn({ x: m.x, y: m.y, z: m.z, vx: (Math.random() - 0.5) * 2, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 2, size: 0.12, sizeEnd: 0.3, life: 0.4, r: 0.5, g: 0.05, b: 0.08, alpha: 0.8, alphaEnd: 0, tex: TEX_PUFF, gravity: -6 });
      if (this.t >= this.chewAt) {
        this.chewed = true;
        const hollow = isHollow(o);
        g.damage(o, hollow ? 9999 : 90, f, f.forward(_v).clone(), { heavy: true, unblockable: true, knock: 10, hitstop: 0.1, shake: 0.3 });
        this.kit.devoured();
      }
    }
  }
}

/** Spirit Body Fusion: red tentacles flung out over his shoulders; whatever they hook is drained and stumbles. */
class FusionAction extends SkillAction {
  readonly name = 'fusion';
  private shot = false;
  private at = 0.22;
  constructor(readonly kit: AaronieroKit) {
    super();
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('ar_fusion')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.at = c.events.shoot ?? 0.22;
    f.anim.play('ar_fusion');
    g.callout('霊体融合', 'SPIRIT BODY FUSION', '#ff5a6e');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.shot || this.t < this.at) return;
    this.shot = true;
    const from = sock(f, 'back');
    const fw = f.forward(_v).clone();
    // five tentacles fanned out to 12 m; each hooks the first soul along it
    let hooked = 0;
    const taken = new Set<number>();
    for (let i = 0; i < 5; i++) {
      const a = (i - 2) * 0.24;
      const dir = fw.clone().applyAxisAngle(UP, a);
      const tgt = this.kit.target(14);
      // the middle tentacles home on the target
      if (tgt && i >= 1 && i <= 3) dir.lerp(_w.subVectors(tgt.center(), from).normalize(), i === 2 ? 1 : 0.85).normalize();
      let hit: Fighter | null = null, hd = 12;
      for (const o of g.enemiesOf(f)) {
        if (taken.has(o.id)) continue;
        const c = o.center(_u);
        const along = _w.subVectors(c, from).dot(dir);
        if (along < 0 || along > hd) continue;
        const off = _w.subVectors(c, from).addScaledVector(dir, -along).length();
        if (off > o.def.radius + 0.6) continue;
        hit = o;
        hd = along;
      }
      const end = hit ? null : from.clone().addScaledVector(dir, 12);
      const victim = hit;
      if (victim) {
        taken.add(victim.id);
        if (this.kit.hook(victim)) hooked++;
      }
      g.addProjectile(new FusionTendril(g, () => sock(f, 'back'), victim ? () => victim.center() : () => end!, victim ? () => this.kit.hooks.some((h) => h.o === victim) : () => false));
    }
    g.sfx.play(hooked ? 'hit' : 'swing', from, 0.8);
  }
}

/** Zanpakutō Destruction armed: the back tentacles glow; the next blade that strikes him shatters. */
class ArmAction extends SkillAction {
  readonly name = 'arm';
  private armed = false;
  constructor(readonly kit: AaronieroKit) {
    super();
    this.mobility = 0;
  }
  override start(f: Fighter): void {
    const c = f.anim.clip('ar_arm')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play('ar_arm');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.armed && this.t >= 0.3) {
      this.armed = true;
      this.kit.destructT = 6;
      g.callout('斬魄刀破壊', 'ZANPAKUTŌ DESTRUCTION', '#c94dff');
      g.sfx.play('charge', f.center(), 0.6);
      f.aura.flare(1.2, 0.4);
    }
  }
}

/** The aspect: the hand drawn down over the face — Kaien Shiba looks out (only in shadow). */
class AspectAction extends SkillAction {
  readonly name = 'aspect';
  private swapped = false;
  constructor(readonly kit: AaronieroKit, readonly on: boolean) {
    super();
    this.mobility = 0.2;
    this.trackTarget = false;
  }
  override start(f: Fighter): void {
    const c = f.anim.clip('ar_aspect')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play('ar_aspect');
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.swapped && this.t >= 0.45) {
      this.swapped = true;
      if (this.on) this.kit.becomeKaien(this.kit.nejibana);
      else this.kit.becomeTrue(true);
      g.sfx.play('mask', f.center(), 0.6);
      void g;
    }
  }
}

/** "Kuitsukuse, Glotonería": the glove torn off, the maw swells and the mass erupts under him. */
class GlotReleaseAction extends SkillAction {
  readonly name = 'release';
  private erupted = false;
  constructor(readonly kit: AaronieroKit) {
    super();
    this.invulnerable = true;
    this.trackTarget = false;
    this.dur = 2.4;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('ar_release', {
      onEvent: (n) => {
        if (n === 'name') g.callout('喰い尽くせ「喰虚」', 'KUITSUKUSE, GLOTONERÍA', '#c94dff');
        if (n === 'tear') {
          this.kit.showMaw(9);
          f.aura.flare(1.6, 0.6);
          g.sfx.play('crack', f.center(), 0.9);
        }
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t > 0.9 && this.t < 1.3 && Math.random() < dt * 30) poolBoil(g, f.pos, 2.5 + (this.t - 0.9) * 8);
    if (!this.erupted && this.t >= 1.15) {
      this.erupted = true;
      this.kit.becomeGlot();
      f.anim.play('gl_roar');
    }
  }
}

/** "Suiten sakamake, Nejibana": the sword held upside down and twirled; it becomes the trident in a burst of water. */
class NejibanaReleaseAction extends SkillAction {
  readonly name = 'nejibana';
  private done1 = false;
  constructor(readonly kit: AaronieroKit) {
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
      this.kit.becomeKaien(true);
      const c = f.center();
      splash(g, c, 1.6);
      g.engine.glow.spawn({ x: c.x, y: c.y + 0.4, z: c.z, size: 0.8, sizeEnd: 3.6, life: 0.5, r: 1, g: 0.89, b: 0.36, alpha: 0.85, alphaEnd: 0, tex: TEX_GLOW });
      f.aura.flare(1.5, 0.5);
    }
  }
}

// ------------------------------------------------------------------------------------------------ Kaien

/** One cut or spear stroke: the step in, the blade window, the water arc, the chain on input. */
class CutAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private opened = false;
  private arced = false;
  queued = false;
  private readonly m: (typeof MOVES)[string];
  constructor(readonly kit: AaronieroKit | null, readonly move: string, readonly index: number) {
    super();
    this.m = MOVES[move];
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
      this.kit?.waterArc(m.arc, this.move === 'nj_s4');
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
class ShakkahoAction extends SkillAction {
  readonly name: string;
  private fired = 0;
  private times: number[] = [];
  constructor(readonly kit: AaronieroKit, readonly n: number) {
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
class TideAction extends SkillAction {
  readonly name = 'tide';
  private opened = false;
  private waved = false;
  private pinned: Fighter | null = null;
  private pinT = 0;
  constructor(readonly kit: AaronieroKit) {
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
class WaveAction extends SkillAction {
  readonly name = 'wave';
  private driven = false;
  private at = 0.36;
  constructor(readonly kit: AaronieroKit) {
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
class SpiralAction extends SkillAction {
  readonly name = 'spiral';
  private fired = false;
  private at = 0.3;
  constructor(readonly kit: AaronieroKit) {
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

// ------------------------------------------------------------------------------------------------ Glotonería

/** LMB on the mass: a tentacle directed by an arm, raised and slammed down (the fourth sweeps round flat). */
class SlamAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  queued = false;
  constructor(readonly kit: AaronieroKit, readonly clip: string, readonly index: number) {
    super();
    this.name = clip;
    this.mobility = 0.15;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.7;
    const hitAt = c.events.hit ?? 0.45;
    f.anim.play(this.clip);
    const dmg = [70, 70, 90, 110][this.index];
    const k = this.kit;
    const at = k.aimGround(14);
    if (this.clip === 'gl_s4') k.sweep(at, dmg, hitAt);
    else if (this.clip === 'gl_s3') {
      // both arms: two tentacles, either side of the target
      const side = _w.set(-(at.z - f.pos.z), 0, at.x - f.pos.x).normalize().multiplyScalar(1.8);
      k.slam(at.clone().add(side), dmg, hitAt, 4);
      k.slam(at.clone().sub(side), dmg, hitAt + 0.06, 4);
    } else k.slam(at, dmg, hitAt, 4);
    g.sfx.play('swingHeavy', f.center(), 1.2);
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
    return (next.name === 'dash' || next instanceof SkillAction) && this.t >= this.comboAt - 0.1;
  }
}

/** The impale (in shadow): Nejibana driven out from the upper body, a 6 m thrust. */
class ImpaleAction extends SkillAction {
  readonly name = 'impale';
  private struck = false;
  constructor(readonly kit: AaronieroKit) {
    super();
    this.mobility = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('gl_impale')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.visual.attach('spear', aaronieroProp('nejibana'), 'grip.R');
    f.anim.play('gl_impale');
    g.sfx.play('swingHeavy', f.center(), 1);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.struck || this.t < 0.3) return;
    this.struck = true;
    const from = sock(f, 'grip.R');
    const dir = this.kit.aim(from).sub(from).normalize();
    // the trident's reach, and a thrust of water on past it
    let best: Fighter | null = null, bd = 6.5;
    for (const o of g.enemiesOf(f)) {
      const c = o.center(_u);
      const along = _w.subVectors(c, from).dot(dir);
      if (along < 0 || along > bd) continue;
      if (_w.subVectors(c, from).addScaledVector(dir, -along).length() > o.def.radius + 0.7) continue;
      best = o;
      bd = along;
    }
    if (best) {
      g.damage(best, 120, f, dir.clone(), { heavy: true, knock: 18, launch: 4, hitstop: 0.12, shake: 0.4 });
      g.sparks(best.center(), dir, WATER, 14);
    }
    const end = from.clone().addScaledVector(dir, 6);
    splash(g, end, 1.4, dir);
    const sp = WaterSpray.of(g);
    for (let i = 0; i < 24; i++) {
      const p = _u.lerpVectors(from, end, Math.random());
      sp.spawn(p.x, p.y, p.z, dir.x * 8 + (Math.random() - 0.5) * 2, dir.y * 8 + Math.random() * 2, dir.z * 8 + (Math.random() - 0.5) * 2, 0.06, 0.7, 0.6);
    }
  }
  override end(f: Fighter): void {
    f.visual.detach('spear');
    f.anim.play('gl_rest');
  }
}

/** The capsule-head Cero (in the light; a light-blue beam out of the glass — game-only). */
class GlotCeroAction extends SkillAction {
  readonly name = 'cero';
  constructor(readonly kit: AaronieroKit) {
    super();
    this.mobility = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('gl_cero')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    const fireAt = c.events.fire ?? 0.5;
    f.anim.play('gl_cero', { onEvent: (n) => n === 'fire' && g.sfx.play('beam', f.center(), 1.2) });
    const em = this.kit.headMuzzle();
    const aim = new THREE.Vector3();
    const target = () => {
      em.updateWorldMatrix(true, false);
      return this.kit.aim(em.getWorldPosition(_u), aim);
    };
    g.addProjectile(new CeroBeam(g, f, em, target, { charge: fireAt, fire: 0.6, radius: 0.8, damage: 90, power: 320, core: '#E6FBFF', body: '#6CD8FF', rim: '#1A6E9A', range: 60, track: 0.6, gain: 1.6 }));
    g.callout('虚閃', 'CERO', '#7fe0ff');
    g.sfx.play('charge', f.center(), 0.8);
  }
}

/** The horde: eaten Hollows boil out of the pool and fight for him. */
class HordeAction extends SkillAction {
  readonly name = 'horde';
  private called = false;
  constructor(readonly kit: AaronieroKit, readonly army = false) {
    super();
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('gl_horde')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play('gl_horde');
    if (this.army) g.callout('三万三千六百五十', 'THE ARMY OF 33,650', '#c94dff');
    g.sfx.play('roar', f.center(), 1);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (Math.random() < dt * 12) poolBoil(g, f.pos.clone().setY(f.pos.y + 3.4), 2.6);
    if (this.called || this.t < 0.4) return;
    this.called = true;
    this.kit.callHorde(this.army ? 4 : 3);
    if (this.army) this.kit.army();
  }
}

/** The tidal sweep: both arms swung round, a fan of water blades thrown out across the front. */
class SweepAction extends SkillAction {
  readonly name = 'sweep';
  private thrown = false;
  constructor(readonly kit: AaronieroKit) {
    super();
    this.mobility = 0.05;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('gl_s4')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play('gl_s4');
    g.sfx.play('torrent', f.center(), 1);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.thrown || this.t < 0.42) return;
    this.thrown = true;
    const fw = f.forward(_v).setY(0).normalize().clone();
    const side = new THREE.Vector3(fw.z, 0, -fw.x);
    for (let i = 0; i < 5; i++) {
      const dir = fw.clone().applyAxisAngle(UP, (i - 2) * 0.3);
      const from = f.pos.clone().addScaledVector(dir, MASS_W * 0.75).setY(f.pos.y + 1.3);
      g.addProjectile(new WaterBlade(g, f, from, dir, side.clone().applyAxisAngle(UP, (i - 2) * 0.3), 30, 2.4, 16, 300));
    }
    splash(g, f.pos.clone().addScaledVector(fw, MASS_W * 0.8).setY(f.pos.y + 0.5), 2.4, fw);
  }
}

/** The swallow: a tentacle seizes the victim and drags it into the mouth in front, which chews and spits it out. */
class SwallowAction extends SkillAction {
  readonly name = 'swallow';
  private victim: Fighter | null = null;
  private grabbed = false;
  private from = new THREE.Vector3();
  private heldT = 0;
  constructor(readonly kit: AaronieroKit) {
    super();
    this.mobility = 0;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('gl_swallow')!;
    this.dur = 2.3;
    f.anim.play('gl_swallow');
    const at = this.kit.aimGround(14);
    this.kit.slam(at, 0, c.events.grab ?? 0.3, 0);
    g.sfx.play('swingHeavy', f.center(), 1);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.grabbed && this.t >= 0.32) {
      this.grabbed = true;
      const at = this.kit.aimGround(14);
      let best: Fighter | null = null, bd = 3;
      for (const o of g.enemiesOf(f)) {
        const d = Math.hypot(o.pos.x - at.x, o.pos.z - at.z) - o.def.radius;
        if (d < bd) { bd = d; best = o; }
      }
      if (best && !best.invuln && !best.action?.invulnerable) {
        this.victim = best;
        this.from.copy(best.pos);
        best.stopAction();
        // the tentacle wrapped round it, hauling it in
        const v = best;
        const base = () => f.pos.clone().addScaledVector(f.forward(_w), f.def.radius * 0.7).setY(f.pos.y + 1.6);
        g.addProjectile(new FusionTendril(g, base, () => v.center(), () => this.victim === v, 0.32, { color: '#6A2D82', emissive: '#1E0A28' }));
        g.sfx.play('hitHeavy', best.center(), 1);
        if (best === g.player) g.hud?.showBanner('Seized — dragged into the maw', 1.4);
      }
    }
    const o = this.victim;
    if (!o) {
      if (this.grabbed && this.t > 1.2) this.done = true;
      return;
    }
    if (o.dead || !g.fighters.includes(o)) {
      this.victim = null;
      return;
    }
    const mouth = f.pos.clone().addScaledVector(f.forward(_v), f.def.radius + o.def.radius * 0.6).setY(f.pos.y + 0.6);
    const k = Math.min(1, (this.t - 0.32) / 0.6);
    const p = _u.lerpVectors(this.from, mouth, k * k * (3 - 2 * k));
    o.body.pos.set(p.x, p.y, p.z);
    o.body.prev.copy(o.body.pos);
    o.body.vel.set(0, 0, 0);
    o.hitstun = Math.max(o.hitstun, 0.25);
    if (k >= 1) {
      this.heldT += dt;
      g.drain(o, 65 * dt, f);
      if (Math.random() < dt * 14) g.engine.dust.spawn({ x: mouth.x, y: mouth.y + 0.6, z: mouth.z, vx: (Math.random() - 0.5) * 3, vy: Math.random() * 3, vz: (Math.random() - 0.5) * 3, size: 0.3, sizeEnd: 0.7, life: 0.5, r: 0.45, g: 0.05, b: 0.1, alpha: 0.8, alphaEnd: 0, tex: TEX_PUFF, gravity: -6 });
      if (this.heldT >= 1.2) {
        // spat out
        this.victim = null;
        const fw = f.forward(_v).clone();
        g.damage(o, 48, f, fw, { heavy: true, unblockable: true, knock: 22, launch: 9, hitstop: 0.1, shake: 0.4 });
        this.done = true;
      }
    }
  }
  override end(): void {
    this.victim = null;
  }
}

/** The guard: tentacles curled over the head and the arms raised over it (held; G again lets go). */
class GuardAction extends SkillAction {
  readonly name = 'guard';
  private arms: PropMesh[] = [];
  constructor(readonly kit: AaronieroKit) {
    super();
    this.mobility = 0.05;
    this.armor = 0.7;
    this.trackTarget = false;
    this.dur = 4;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('gl_guard', { hold: true });
    for (let i = 0; i < 2; i++) {
      const m = new PropMesh(aaronieroProp('tentacle'));
      m.frustumCulled = false;
      g.engine.gr.scene.add(m);
      this.arms.push(m);
    }
    this.kit.refreshWeak();
    g.sfx.play('crumble', f.center(), 0.8);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const grow = Math.min(1, this.t * 4);
    const fw = f.forward(_v);
    const side = _w.set(fw.z, 0, -fw.x);
    this.arms.forEach((m, i) => {
      const k = i === 0 ? 1 : -1;
      const base = new THREE.Vector3(f.pos.x + side.x * k * 1.5 - fw.x * 0.8, f.pos.y + 3.1, f.pos.z + side.z * k * 1.5 - fw.z * 0.8);
      const over = new THREE.Vector3(f.pos.x + fw.x * 0.3, f.pos.y + GLOT_LIFT + 2.6, f.pos.z + fw.z * 0.3);
      m.position.copy(base);
      m.quaternion.setFromUnitVectors(FWD, over.sub(base).normalize());
      m.scale.setScalar(0.5 * grow);
    });
  }
  override end(f: Fighter): void {
    for (const m of this.arms) {
      m.removeFromParent();
      m.material.dispose();
    }
    this.arms = [];
    f.anim.stopAll(0.25);
    // (the action is still his while it ends)
    this.kit.refreshWeak(false);
  }
}

/** Arrogance: after a big hit he stops to gloat. */
class GloatAction extends SkillAction {
  readonly name = 'gloat';
  constructor() {
    super();
    this.mobility = 0;
    this.dur = 0.9;
  }
}

// ------------------------------------------------------------------------------------------------ the kit

interface Hook {
  o: Fighter;
  until: number;
  nextRoll: number;
  nextLash: number;
}

export class AaronieroKit implements Kit {
  form: Form = 'true';
  /** the mask is on (true form): the light cannot reach the capsule */
  maskOn = true;
  /** Nejibana was released: the aspect comes back with the trident */
  nejibana = false;
  head: AaronieroHead = 'mask';
  lit = true;
  /** devoured stacks (each eaten Hollow: +3 % power, +20 max HP) */
  stacks = 0;
  /** Zanpakutō Destruction armed (s left) and spent */
  destructT = 0;
  destructUsed = false;
  flare = false;
  comboIndex = 0;
  readonly hooks: Hook[] = [];
  readonly horde: Fighter[] = [];
  private glass: CapsuleGlass | null = null;
  private lastSwingEnd = 0;
  private lightT = 0;
  private mawUntil = 0;
  private rootT = 0;
  private surgeHits = new Set<number>();
  private surging = false;
  private lastDealt = 0;
  private bigHitAt = -10;
  private mourned = false;
  private hesitated = false;
  private shade: THREE.Vector3 | null = null;
  private shadeAt = 0;
  private timers: { t: number; fn: () => void }[] = [];
  private cd = { devour: 0, fusion: 0, arm: 0, aspect: 0, mask: 0, shakkaho: 0, rapid: 0, thrust: 0, nejibana: 0, tide: 0, wave: 0, spiral: 0, impale: 0, cero: 0, horde: 0, sweep: 0, swallow: 0, army: 0, guard: 0, gloat: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.toughness = 8;
    f.onHurt = (amount, heavy) => this.hurt(amount, heavy);
    f.parry = (amount, from, o) => this.parry(amount, from, o);
    this.lastDealt = f.stats.damageDealt;
  }

  // ---------------------------------------------------------------------------------------------- per step

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const tm = this.timers[i];
      if ((tm.t -= dt) <= 0) {
        this.timers.splice(i, 1);
        tm.fn();
      }
    }
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    if (f.dead) {
      if (!this.mourned) this.die();
      return;
    }
    // the light: a ray from his head toward the sun
    this.lightT -= dt;
    if (this.lightT <= 0) this.checkLight();
    this.glass?.update(dt);
    // the maw goes back under the glove
    if (this.mawUntil > 0 && g.time > this.mawUntil && this.form !== 'glot') this.hideMaw();
    // Zanpakutō Destruction: the back tentacles glow while armed
    if (this.destructT > 0) {
      this.destructT -= dt;
      if (Math.random() < dt * 18) {
        const b = sock(f, 'back');
        g.engine.glow.spawn({ x: b.x + (Math.random() - 0.5) * 0.5, y: b.y + (Math.random() - 0.3) * 0.6, z: b.z + (Math.random() - 0.5) * 0.5, vx: 0, vy: 0.6, vz: 0, size: 0.16, sizeEnd: 0.04, life: 0.5, r: 0.8, g: 0.2, b: 0.9, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
      }
    }
    this.tendHooks(dt);
    for (let i = this.horde.length - 1; i >= 0; i--) if (this.horde[i].dead || !g.fighters.includes(this.horde[i])) this.horde.splice(i, 1);
    // strength: no Kidō holds him for long
    if (f.rooted) {
      this.rootT += dt;
      if (this.rootT > 1) {
        f.rooted = false;
        this.rootT = 0;
        f.aura.flare(1.2, 0.3);
        g.sfx.play('crack', f.center(), 0.7);
      }
    } else this.rootT = 0;
    // Kaien's voice: whoever fought beside Kaien hesitates (its blows −30 %); reset each step, set per blow
    f.damageTaken = this.baseTaken();
    // the tentacle surge (Shift on the mass): a lunge that crushes what it crosses
    if (this.form === 'glot' && f.dashT > 0) {
      if (!this.surging) {
        this.surging = true;
        this.surgeHits.clear();
        g.sfx.play('roarBig', f.center(), 0.8);
      }
      for (const o of g.enemiesOf(f)) {
        // (nobody stands closer than the mass's edge: the fighters are kept apart by their hurt radii)
        if (this.surgeHits.has(o.id) || Math.hypot(o.pos.x - f.pos.x, o.pos.z - f.pos.z) > f.def.radius + o.def.radius + 1.2) continue;
        this.surgeHits.add(o.id);
        g.damage(o, 50, f, _w.subVectors(o.pos, f.pos).setY(0).normalize().clone(), { heavy: true, knock: 22, launch: 6, hitstop: 0.08, shake: 0.4 });
      }
      if (Math.random() < dt * 30) g.engine.dust.spawn({ x: f.pos.x + (Math.random() - 0.5) * 8, y: f.pos.y + 0.3, z: f.pos.z + (Math.random() - 0.5) * 8, vx: 0, vy: 1, vz: 0, size: 1.2, sizeEnd: 3, life: 0.8, r: 0.6, g: 0.56, b: 0.5, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF });
    } else this.surging = false;
    // a big blow landed: (the AI) he stops to gloat
    const dealt = f.stats.damageDealt;
    if (dealt - this.lastDealt > 80) this.bigHitAt = g.time;
    this.lastDealt = dealt;
  }

  /** the light check now: a ray from his head toward the sun */
  checkLight(): void {
    this.lightT = 0.2;
    this.lit = sunlit(this.g, this.headPoint(_v));
    this.tendLight();
  }

  after(s: number, fn: () => void): void {
    this.timers.push({ t: s, fn });
  }

  /** where the light check is made: his head (the capsule's middle on the mass) */
  headPoint(out: THREE.Vector3): THREE.Vector3 {
    const f = this.f;
    return out.set(f.pos.x, f.pos.y + (this.form === 'glot' ? GLOT_LIFT + 1.95 : 1.95), f.pos.z);
  }

  private tendLight(): void {
    const { f, g } = this;
    if ((this.form === 'kaien' || this.form === 'nejibana') && this.lit) {
      // sunlight on Kaien's face: the borrowed flesh sloughs off, the capsule is bared
      slough(g, this.headPoint(_w));
      g.sfx.play('crumble', f.center(), 0.8);
      g.hud?.showBanner(f === g.player ? 'The light — Kaien\'s face sloughs away' : 'The light melts Kaien\'s face away', 1.6);
      if (f.action) f.stopAction();
      this.becomeTrue(false);
      return;
    }
    if (this.form === 'glot') {
      const want: AaronieroHead = this.lit ? 'capsule' : 'kaien';
      if (want !== this.head) {
        if (want === 'capsule') slough(g, this.headPoint(_w));
        this.setHead(want);
      }
    }
  }

  // ---------------------------------------------------------------------------------------------- heads and forms

  /** the head on his shoulders: the mask, the capsule (with its glass and liquid) or Kaien's */
  setHead(h: AaronieroHead): void {
    const f = this.f;
    this.head = h;
    const glot = this.form === 'glot';
    f.visual.attach('head', aaronieroProp((glot ? `glot-${h}` : h) as AaronieroProp), 'skull');
    this.glass?.dispose();
    this.glass = null;
    if (h === 'capsule') {
      const sk = f.visual.rig.sockets.get('skull');
      if (sk) this.glass = new CapsuleGlass(sk, { y: CAPSULE.y + (glot ? GLOT_LIFT : 0), r: CAPSULE.r, h: CAPSULE.h });
    }
    this.refreshWeak();
  }

  /** the bare capsule is the weak point (hits on it ×3) unless the tentacles cover it */
  refreshWeak(guarded = this.f.action instanceof GuardAction): void {
    const f = this.f;
    const bare = this.head === 'capsule' && !guarded;
    f.def = { ...f.def, weakAbove: bare ? (this.form === 'glot' ? 0.86 : 0.8) : undefined };
  }

  private props(): { key: string; model: ReturnType<typeof aaronieroProp>; socket: string }[] {
    const glot = this.form === 'glot';
    const head = { key: 'head', model: aaronieroProp((glot ? `glot-${this.head}` : this.head) as AaronieroProp), socket: 'skull' };
    if (glot) return [head, { key: 'mass', model: aaronieroProp('mass'), socket: 'mass' }];
    if (this.form === 'true') return [head, { key: 'saya', model: aaronieroProp('sheath'), socket: 'hip.L' }];
    return [head, { key: this.form === 'nejibana' ? 'spear' : 'sword', model: aaronieroProp(this.form === 'nejibana' ? 'nejibana' : 'katana'), socket: 'grip.R' }, { key: 'saya', model: aaronieroProp('sheath-empty'), socket: 'hip.L' }];
  }

  private formPower(): number {
    return this.form === 'glot' ? 1.6 : this.form === 'nejibana' ? 1.25 : this.form === 'kaien' ? 1.1 : 1;
  }

  private baseTaken(): number {
    return this.form === 'glot' ? 0.75 : this.form === 'nejibana' ? 0.95 : 1;
  }

  /** power and HP follow the form, the eaten stacks and the flare */
  private applyStats(): void {
    const f = this.f;
    f.power = this.formPower() * (1 + 0.03 * this.stacks) * (this.flare ? 1.25 : 1);
    const max = f.def.hp + 20 * this.stacks;
    if (f.maxHp !== max) {
      f.hp += max - f.maxHp;
      f.maxHp = max;
    }
  }

  private swapBody(blade: Blade): void {
    const f = this.f;
    const lv = f.aura.level;
    f.anim.stopAll(0.05);
    this.glass?.dispose();
    this.glass = null;
    f.setForm({ asset: aaronieroAsset(this.form === 'glot' ? 'glotoneria' : 'sealed'), props: this.props() }, this.form === 'glot' ? AURA_GLOT : AURA_AARONIERO, blade);
    f.aura.level = lv;
    f.aura.target = this.flare ? 1 : this.form === 'glot' ? 0.4 : 0.15;
    this.setHead(this.head);
    this.applyStats();
  }

  /** E in shadow: Kaien looks out (`spear`: with Nejibana already released) */
  becomeKaien(spear: boolean): void {
    const f = this.f;
    this.form = spear ? 'nejibana' : 'kaien';
    this.maskOn = false;
    this.head = 'kaien';
    if (spear) this.nejibana = true;
    f.def = { ...f.def, stance: spear ? NEJIBANA_STANCE : KAIEN_STANCE, clips: spear ? NEJIBANA_CLIPS : KAIEN_CLIPS, speed: { ...SPEED_KAIEN } };
    this.swapBody(spear ? TRIDENT : KATANA);
    if (!spear) this.g.hud?.showBanner('"Yo. Long time no see."', 1.4);
  }

  /** back to the true form: masked (E, the mask put back on) or bared (the light took Kaien's face) */
  becomeTrue(masked: boolean): void {
    const f = this.f;
    this.form = 'true';
    this.maskOn = masked;
    this.head = masked ? 'mask' : 'capsule';
    f.def = { ...f.def, stance: AARONIERO_STANCE, clips: AARONIERO_CLIPS, speed: { ...SPEED_TRUE } };
    this.swapBody(KATANA);
  }

  /** Glotonería: the mass, a full heal, everything he ever ate */
  becomeGlot(): void {
    const { f, g } = this;
    this.form = 'glot';
    this.maskOn = false;
    this.head = this.lit ? 'capsule' : 'kaien';
    this.hideMaw();
    f.def = { ...f.def, stance: GLOT_STANCE, clips: GLOT_CLIPS, speed: { ...SPEED_GLOT }, radius: 4.6, height: GLOT_LIFT + 2.45, boss: true };
    this.swapBody(TRIDENT);
    f.body.hw = 0.6;
    f.body.h = 2.4;
    f.body.stepUp = 2.6;
    f.giant = true;
    f.hovering = false;
    f.hp = f.maxHp;
    f.toughness = 22;
    f.aura.flare(2.4, 1.2);
    for (let i = 0; i < 6; i++) this.after(i * 0.08, () => poolBoil(g, f.pos.clone().setY(f.pos.y + 1), 3 + i));
    g.sfx.play('bankai', f.center(), 1);
    g.sfx.play('roarBig', f.center(), 1);
    g.shake(0.5);
  }

  /** the gloved hand opens on the maw for a while */
  showMaw(s: number): void {
    const f = this.f;
    this.mawUntil = Math.max(this.mawUntil, this.g.time + s);
    if (f.visual.props.has('maw')) return;
    f.visual.attach('maw', aaronieroProp('maw'), 'maw');
    f.visual.rig.setBoneVisible('palm.L', false);
    f.visual.rig.setBoneVisible('fist.L', false);
  }

  private hideMaw(): void {
    const f = this.f;
    this.mawUntil = 0;
    if (!f.visual.props.has('maw')) return;
    f.visual.detach('maw');
    f.autoHands();
  }

  // ---------------------------------------------------------------------------------------------- devour, hooks, the shatter

  /** a soul eaten: he heals and grows (one more stack, up to 20) */
  devoured(): void {
    const { f, g } = this;
    f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.15);
    if (this.stacks < 20) {
      this.stacks++;
      this.applyStats();
      f.hp = Math.min(f.maxHp, f.hp + 20);
    }
    f.aura.flare(1.3, 0.5);
    g.sfx.play('heal', f.center(), 0.7);
    if (f === g.player) g.hud?.showBanner(`Devoured — ${this.stacks} eaten`, 1.2);
  }

  /** Spirit Body Fusion takes a soul: drained, its steps scrambled (false: it slipped away) */
  hook(o: Fighter): boolean {
    const g = this.g;
    if (o.dead || o.invuln > 0 || o.action?.invulnerable) return false;
    const old = this.hooks.find((h) => h.o === o);
    if (old) {
      old.until = g.time + 3;
      return true;
    }
    this.hooks.push({ o, until: g.time + 3, nextRoll: 0, nextLash: 0 });
    g.damage(o, 10, this.f, _w.subVectors(o.pos, this.f.pos).setY(0).normalize().clone(), { knock: 2, color: '#C2263A' } as DamageOpts);
    if (o === g.player) g.hud?.showBanner('Something is in your soul — your steps are not your own', 1.6);
    return true;
  }

  private unhookAll(): void {
    for (const h of this.hooks) h.o.scrambleT = 0;
    this.hooks.length = 0;
  }

  private tendHooks(dt: number): void {
    const { f, g } = this;
    for (let i = this.hooks.length - 1; i >= 0; i--) {
      const h = this.hooks[i];
      const o = h.o;
      if (o.dead || g.time >= h.until || !g.fighters.includes(o)) {
        o.scrambleT = 0;
        this.hooks.splice(i, 1);
        continue;
      }
      // the parasite turns its every step
      o.scrambleT = 0.3;
      if (g.time >= h.nextRoll) {
        h.nextRoll = g.time + 0.5;
        o.scrambleA = (Math.random() < 0.5 ? 1 : -1) * (1 + Math.random() * 2.1);
      }
      // drained to him
      const before = o.hp;
      g.drain(o, 12 * dt, f);
      f.hp = Math.min(f.maxHp, f.hp + Math.max(0, before - o.hp));
      if (g.time >= h.nextLash) {
        h.nextLash = g.time + 0.15;
        const c = o.center();
        g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: (Math.random() - 0.5) * 2, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 2, size: 0.2, sizeEnd: 0.05, life: 0.4, r: 0.76, g: 0.15, b: 0.23, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
      }
    }
  }

  /** the next blade on his armed back shatters (once per fight); Kaien's friends hesitate */
  private parry(amount: number, from: Fighter | null, o: DamageOpts): boolean {
    const { f, g } = this;
    void amount;
    const friend = !!from && (this.form === 'kaien' || this.form === 'nejibana') && KAIEN_FRIENDS.has(from.def.id);
    f.damageTaken = this.baseTaken() * (friend ? 0.7 : 1);
    if (friend) {
      if (!this.hesitated) {
        this.hesitated = true;
        g.hud?.showBanner('"…Kaien-dono?" — the blade wavers', 2);
      }
    }
    if (this.destructT > 0 && !this.destructUsed && from && from.bladeActive && from.def.blade && !o.energy && from.disarmT <= 0) {
      this.destructT = 0;
      this.destructUsed = true;
      from.disarmT = Math.max(from.disarmT, from.def.boss ? 3 : 10);
      bladeShatter(g, from.blade.tip.clone().lerp(from.blade.base, 0.4));
      g.callout('斬魄刀破壊', 'ZANPAKUTŌ DESTRUCTION', '#c94dff');
      g.shake(0.3);
      if (from === g.player) g.hud?.showBanner('Your Zanpakutō shatters', 2);
      return true;
    }
    return false;
  }

  private hurt(amount: number, heavy: boolean): void {
    void amount;
    // a heavy blow to him cuts the fusion tentacles
    if (heavy && this.hooks.length) {
      this.unhookAll();
      fusionLash(this.g, sock(this.f, 'back'), this.f.center().add(new THREE.Vector3(0, 1, 0)));
    }
  }

  private die(): void {
    const g = this.g;
    this.mourned = true;
    this.unhookAll();
    for (const h of [...this.horde]) {
      h.hp = 0;
      h.dead = true;
      g.remove(h);
    }
    this.horde.length = 0;
    this.glass?.dispose();
    this.glass = null;
    // Cognition Synchronization: his last sight goes to every Espada
    g.hud?.showBanner('Cognition Synchronization — what he saw goes to every Espada', 3);
  }

  // ---------------------------------------------------------------------------------------------- the mass

  /** a point on the ground under the aim (or the target), at most `range` m out */
  aimGround(range: number): THREE.Vector3 {
    const { f, g } = this;
    const t = f.faceTarget ?? (f === g.player ? g.aimPoint(f, new THREE.Vector3()) : null);
    const dir = t ? new THREE.Vector3(t.x - f.pos.x, 0, t.z - f.pos.z) : f.forward(new THREE.Vector3()).setY(0);
    const d = Math.min(range, Math.max(5, dir.length()));
    dir.normalize();
    const p = f.pos.clone().addScaledVector(dir, d);
    p.y = groundAt(g, p.x, f.pos.y + 6, p.z, 14) ?? f.pos.y;
    return p;
  }

  /** a tentacle out of the mass, slammed down on `at` at `hitAt` s (r: the blow's radius; 0: no blow) */
  slam(at: THREE.Vector3, dmg: number, hitAt: number, r: number): void {
    const { f, g } = this;
    const dir = new THREE.Vector3(at.x - f.pos.x, 0, at.z - f.pos.z);
    const dist = dir.length();
    dir.normalize();
    const base = () => f.pos.clone().addScaledVector(dir, MASS_W * 0.72).setY(f.pos.y + 1.4);
    const reach = Math.max(1, dist - MASS_W * 0.72);
    const scale = Math.max(0.55, Math.min(2.4, reach / (6 * Math.cos(Math.PI * 0.2))));
    g.addProjectile(new TentacleStrike(g, aaronieroProp('tentacle'), base, at.clone(), 'slam', hitAt + 0.5, hitAt, () => {
      if (f.dead || r <= 0) return;
      for (const o of g.enemiesOf(f)) {
        if (Math.hypot(o.pos.x - at.x, o.pos.z - at.z) > r + o.def.radius || o.pos.y > at.y + 3) continue;
        g.damage(o, dmg, f, dir.clone(), { heavy: true, knock: 14, launch: 8, hitstop: 0.1, shake: 0.5 });
      }
      slamCrater(g, at.clone(), Math.min(3.2, 1.6 + scale * 0.6), 300);
      g.groundImpact(at.clone(), 1.6, 120, GLOT_PURPLE.body, f);
    }, scale));
  }

  /** the fourth: a tentacle swept round flat across the front */
  sweep(at: THREE.Vector3, dmg: number, hitAt: number): void {
    const { f, g } = this;
    const dir = new THREE.Vector3(at.x - f.pos.x, 0, at.z - f.pos.z).normalize();
    const base = () => f.pos.clone().addScaledVector(dir, MASS_W * 0.6).setY(f.pos.y + 1.2);
    const scale = 1.9;
    g.addProjectile(new TentacleStrike(g, aaronieroProp('tentacle'), base, at.clone(), 'sweep', hitAt + 0.55, hitAt, () => {
      if (f.dead) return;
      const b = base();
      for (const o of g.enemiesOf(f)) {
        _w.subVectors(o.pos, b).setY(0);
        const d = _w.length();
        if (d > 6 * scale + o.def.radius || (d > 1 && _w.normalize().dot(dir) < -0.2)) continue;
        g.damage(o, dmg, f, _w.lengthSq() > 0 ? _w.clone() : dir.clone(), { heavy: true, knock: 26, launch: 6, hitstop: 0.1, shake: 0.5 });
      }
      g.shake(0.3);
    }, scale));
  }

  /** an object just in front of the glass head: the light-blue Cero swells there */
  headMuzzle(): THREE.Object3D {
    const s = this.f.visual.rig.sockets.get('skull')!;
    let m = s.children.find((c) => c.userData.muzzle);
    if (!m) {
      m = new THREE.Object3D();
      m.userData.muzzle = true;
      m.position.set(0, CAPSULE.y + GLOT_LIFT + CAPSULE.h * 0.55, 0.35);
      s.add(m);
    }
    return m;
  }

  /** eaten Hollows out of the pool (at most four of them about) */
  callHorde(n: number): void {
    const { f, g } = this;
    for (let i = 0; i < n && this.horde.length < 4; i++) {
      const a = f.yaw + (i - (n - 1) / 2) * 0.9 + (Math.random() - 0.5) * 0.3;
      const p = new THREE.Vector3(f.pos.x + Math.sin(a) * (MASS_W + 1.2), f.pos.y + 0.5, f.pos.z + Math.cos(a) * (MASS_W + 1.2));
      p.y = (groundAt(g, p.x, p.y + 6, p.z, 14) ?? f.pos.y) + 0.1;
      const h = g.spawn(hollowDef(Math.floor(Math.random() * 1e6), 0.9 + Math.random() * 0.35), p, f.team);
      h.yaw = a;
      g.controllers.push(new HollowAI(g, h));
      h.data.eatenBy = f;
      this.horde.push(h);
      h.ghosts.spawn(0.3, 0.7);
      poolBoil(g, p, 1.6);
    }
  }

  /** the army of 33,650: every stack a tentacle, slammed round him in a 14 m ring (40 each) */
  army(): void {
    const { f, g } = this;
    const n = Math.min(28, 8 + this.stacks);
    const foes = g.enemiesOf(f).filter((o) => o.pos.distanceTo(f.pos) < 16);
    for (let i = 0; i < n; i++) {
      this.after(i * 0.07, () => {
        if (f.dead) return;
        let at: THREE.Vector3;
        if (i % 3 === 0 && foes.length) {
          const o = foes[(i / 3) % foes.length];
          at = o.pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2));
        } else {
          const a = (i / n) * Math.PI * 2 + Math.random() * 0.3;
          const r = MASS_W + 1.5 + Math.random() * (14 - MASS_W - 1.5);
          at = new THREE.Vector3(f.pos.x + Math.sin(a) * r, f.pos.y, f.pos.z + Math.cos(a) * r);
        }
        at.y = groundAt(g, at.x, f.pos.y + 6, at.z, 14) ?? f.pos.y;
        this.slam(at, 40, 0.35, 2.4);
      });
    }
    g.shake(0.6);
  }

  // ---------------------------------------------------------------------------------------------- Kaien's water

  /** the arc of water shed by a Nejibana swing; the 4th raises a wave all round where it lands */
  waterArc(plane: 'up' | 'flat' | 'slant', ring: boolean): void {
    const { f, g } = this;
    const fw = f.forward(new THREE.Vector3()).setY(0).normalize();
    const right = new THREE.Vector3(fw.z, 0, -fw.x);
    const side = plane === 'up' ? UP.clone() : plane === 'flat' ? right : right.clone().add(UP).normalize();
    const from = f.center().addScaledVector(fw, 0.9);
    const dir = this.aim(from).sub(from).normalize();
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

  /** where a shot from `from` should go: the target, or the crosshair */
  aim(from: THREE.Vector3, out = new THREE.Vector3()): THREE.Vector3 {
    const { f, g } = this;
    const t = f.faceTarget;
    if (!t && f === g.player) return g.aimPoint(f, out);
    if (t) return out.copy(t);
    return out.copy(from).addScaledVector(f.forward(_u), 30);
  }

  target(range = 40): Fighter | null {
    const { f, g } = this;
    return g.nearestEnemy(f, range, f.forward(), 50) ?? g.nearestEnemy(f, range);
  }

  // ---------------------------------------------------------------------------------------------- the shade (the AI)

  /** the nearest spot within ~25 m where the sun does not reach his head */
  shadeSpot(): THREE.Vector3 | null {
    const { f, g } = this;
    if (g.time < this.shadeAt) return this.shade;
    this.shadeAt = g.time + 1.5;
    let best: THREE.Vector3 | null = null;
    for (const r of [2.5, 5, 8, 12, 17, 24]) {
      for (let i = 0; i < 14 && !best; i++) {
        const a = (i / 14) * Math.PI * 2 + r * 0.7;
        const x = f.pos.x + Math.cos(a) * r, z = f.pos.z + Math.sin(a) * r;
        const gy = groundAt(g, x, f.pos.y + 4, z, 10);
        if (gy === null || g.engine.world.isSolidAtPos(x, gy + 1.2, z) || g.engine.world.isSolidAtPos(x, gy + 0.4, z)) continue;
        if (sunlit(g, _w.set(x, gy + 1.95, z))) continue;
        best = new THREE.Vector3(x, gy, z);
      }
      if (best) break;
    }
    this.shade = best;
    return best;
  }

  // ---------------------------------------------------------------------------------------------- inputs

  private special(a: FighterAction, cost: number, cdKey: keyof AaronieroKit['cd'], cd: number): boolean {
    const { f, g } = this;
    if (this.cd[cdKey] > 0) return false;
    if (f.action && !f.action.canCancel(a)) return false;
    if (f.hitstun > 0 || f.dashT > 0 || f.dead) return false;
    if (!f.spendRei(cost)) {
      if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
      return false;
    }
    this.cd[cdKey] = cd;
    f.act(a, true);
    return true;
  }

  private chainList(): string[] {
    return this.form === 'true' ? AARONIERO_CHAIN : this.form === 'kaien' ? KAIEN_CHAIN : this.form === 'nejibana' ? NEJIBANA_CHAIN : GLOT_CHAIN;
  }

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof BlowAction || cur instanceof CutAction || cur instanceof SlamAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastSwingEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.chainList();
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastSwingEnd = this.g.time + (this.form === 'glot' ? 1.2 : 0.8);
    const f = this.f;
    if (this.form === 'true') f.act(new BlowAction(this, list[idx], idx), true);
    else if (this.form === 'glot') f.act(new SlamAction(this, list[idx], idx), true);
    else f.act(new CutAction(this, list[idx], idx), true);
  }

  /** RMB: devour · the lunging thrust (Kaien) · the crushing tide (Nejibana) · the impale (shade) / the Cero (light) */
  heavy(): void {
    switch (this.form) {
      case 'true':
        this.special(new DevourAction(this), 8, 'devour', 2.5);
        return;
      case 'kaien':
        this.special(new CutAction(this, 'kn_thrust', 3), 8, 'thrust', 2.5);
        return;
      case 'nejibana':
        this.special(new TideAction(this), 16, 'tide', 4);
        return;
      default:
        this.checkLight();
        if (this.lit) this.special(new GlotCeroAction(this), 22, 'cero', 4);
        else this.special(new ImpaleAction(this), 14, 'impale', 3);
    }
  }

  /** Q: Spirit Body Fusion · Shakkahō · the rising wave · the horde */
  skill1(): void {
    switch (this.form) {
      case 'true':
        this.special(new FusionAction(this), 22, 'fusion', 7);
        return;
      case 'kaien':
        this.special(new ShakkahoAction(this, 1), 10, 'shakkaho', 1.4);
        return;
      case 'nejibana':
        this.special(new WaveAction(this), 18, 'wave', 4);
        return;
      default:
        if (this.horde.length >= 4) {
          if (this.f === this.g.player) this.g.hud?.showBanner('The horde is out');
          return;
        }
        this.special(new HordeAction(this), 26, 'horde', 10);
    }
  }

  /** E: the aspect (in shadow) · back to the mask · the tidal sweep */
  skill2(): void {
    const { f, g } = this;
    switch (this.form) {
      case 'true':
        this.checkLight();
        if (this.lit) {
          if (f === g.player) g.hud?.showBanner('Too much light — the aspect will not hold');
          return;
        }
        this.special(new AspectAction(this, true), 8, 'aspect', 2);
        return;
      case 'kaien':
      case 'nejibana':
        this.special(new AspectAction(this, false), 0, 'aspect', 2);
        return;
      default:
        this.special(new SweepAction(this), 18, 'sweep', 4);
    }
  }

  /** R: Zanpakutō Destruction · the rapid Shakkahō · the spiral thrust · the swallow */
  skill3(): void {
    const { f, g } = this;
    switch (this.form) {
      case 'true':
        if (this.destructUsed) {
          if (f === g.player) g.hud?.showBanner('Zanpakutō Destruction is spent for tonight');
          return;
        }
        this.special(new ArmAction(this), 20, 'arm', 9);
        return;
      case 'kaien':
        this.special(new ShakkahoAction(this, 3), 22, 'rapid', 5);
        return;
      case 'nejibana':
        this.special(new SpiralAction(this), 24, 'spiral', 6);
        return;
      default:
        this.special(new SwallowAction(this), 24, 'swallow', 8);
    }
  }

  /** F: Glotonería (true form) · Nejibana (Kaien) · Glotonería (Nejibana) · the army of 33,650 (the mass) */
  release(): void {
    const { f, g } = this;
    if (this.form === 'glot') {
      this.special(new HordeAction(this, true), 60, 'army', 25);
      return;
    }
    if (this.form === 'kaien') {
      this.special(new NejibanaReleaseAction(this), 30, 'nejibana', 2);
      return;
    }
    if (f.busy && !(f.action instanceof SkillAction && f.action.canCancel(new GlotReleaseAction(this)))) return;
    if (!f.spendRei(40)) {
      if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
      return;
    }
    f.act(new GlotReleaseAction(this), true);
  }

  /** G: the mask on/off (true form) · Glotonería (Kaien) · the guard (the mass; G again lets go) */
  toggle(): void {
    const { f, g } = this;
    if (this.form === 'glot') {
      if (f.action instanceof GuardAction) {
        f.stopAction();
        return;
      }
      this.special(new GuardAction(this), 10, 'guard', 6);
      return;
    }
    if (this.form === 'kaien' || this.form === 'nejibana') {
      this.release();
      return;
    }
    if (this.cd.mask > 0 || f.busy) return;
    this.cd.mask = 0.8;
    this.maskOn = !this.maskOn;
    this.setHead(this.maskOn ? 'mask' : 'capsule');
    g.sfx.play('mask', f.center(), 0.6);
  }

  toggleFlare(): void {
    const { f, g } = this;
    this.flare = !this.flare;
    this.applyStats();
    f.aura.target = this.flare ? 1 : this.form === 'glot' ? 0.4 : 0.15;
    if (this.flare) {
      f.aura.flare(1.6, 0.4);
      g.shake(0.2);
      g.sfx.play('flare', f.center());
    }
  }

  formName(): string {
    switch (this.form) {
      case 'true':
        return this.maskOn ? 'Noveno Espada' : 'Noveno Espada — the capsule bared';
      case 'kaien':
        return 'Kaien Shiba';
      case 'nejibana':
        return 'Kaien Shiba — Nejibana';
      default:
        return 'Resurrección — Glotonería';
    }
  }

  ai(): KitAI {
    const is = (...forms: Form[]) => () => forms.includes(this.form);
    const tgt = () => this.target(40);
    const sword = () => {
      const t = tgt();
      return !!t && !!t.def.blade && t.disarmT <= 0;
    };
    const failing = () => {
      const t = this.target(4);
      return !!t && (isHollow(t) || t.hp / t.maxHp < 0.3);
    };
    return {
      reach: 1.8,
      chain: 4,
      ranged: () => this.form === 'nejibana' && Math.random() < 0.3,
      // he wants the dark: the true form walks for the nearest shade to put Kaien's face on there; as Kaien he holds
      // the dark and lets a target standing in the sun come to him
      goal: () => {
        const f = this.f;
        if (this.form === 'kaien' || this.form === 'nejibana') {
          const t = this.target(40);
          if (t && !this.lit && t.pos.distanceTo(f.pos) > 3.5 && sunlit(this.g, _u.set(t.pos.x, t.pos.y + 1.7, t.pos.z))) return f.pos;
          return null;
        }
        if (this.form !== 'true' || f.hp / f.maxHp < 0.4 || !this.lit) return null;
        return this.shadeSpot();
      },
      opener: () => {
        if (this.g.hud) this.g.hud.showBanner('"Welcome to my palace."', 2);
      },
      moves: [
        { name: 'mask', use: () => this.toggle(), min: 0, max: 99, weight: 6, cd: 2, when: () => this.form === 'true' && this.lit && !this.maskOn },
        { name: 'aspect', use: () => this.skill2(), min: 0, max: 99, weight: 9, cd: 2, when: () => this.form === 'true' && !this.lit },
        { name: 'devour', use: () => this.heavy(), min: 0, max: 4, weight: 6, cd: 2, when: () => this.form === 'true' && failing() },
        { name: 'fusion', use: () => this.skill1(), min: 3, max: 12, weight: 2.4, cd: 7, when: is('true') },
        { name: 'arm', use: () => this.skill3(), min: 0, max: 7, weight: 2.2, cd: 12, when: () => this.form === 'true' && !this.destructUsed && sword() },
        { name: 'nejibana', use: () => this.release(), min: 0, max: 99, weight: 5, cd: 4, when: is('kaien') },
        { name: 'shakkaho', use: () => this.skill1(), min: 5, max: 30, weight: 2, cd: 3, when: is('kaien') },
        { name: 'rapid', use: () => this.skill3(), min: 6, max: 30, weight: 1.6, cd: 6, when: is('kaien') },
        { name: 'thrust', use: () => this.heavy(), min: 2, max: 7, weight: 1.6, cd: 3, when: is('kaien') },
        { name: 'tide', use: () => this.heavy(), min: 1, max: 4.5, weight: 2.6, cd: 4, when: is('nejibana') },
        { name: 'wave', use: () => this.skill1(), min: 2.5, max: 10, weight: 2.4, cd: 5, when: is('nejibana') },
        { name: 'spiral', use: () => this.skill3(), min: 4, max: 20, weight: 2.2, cd: 6, when: is('nejibana') },
        { name: 'glotoneria', use: () => (this.form === 'true' ? this.release() : this.toggle()), min: 0, max: 99, weight: 10, cd: 3, when: () => this.form !== 'glot' && this.f.hp / this.f.maxHp < 0.4 },
        { name: 'slam', use: () => this.attack(), min: 3, max: 15, weight: 3, cd: 1.5, when: is('glot') },
        { name: 'impale', use: () => this.heavy(), min: 2, max: 9, weight: 2, cd: 4, when: () => this.form === 'glot' && !this.lit },
        { name: 'cero', use: () => this.heavy(), min: 6, max: 40, weight: 2.2, cd: 5, when: () => this.form === 'glot' && this.lit },
        { name: 'horde', use: () => this.skill1(), min: 0, max: 40, weight: 2.4, cd: 12, when: () => this.form === 'glot' && this.horde.length < 2 },
        { name: 'sweep', use: () => this.skill2(), min: 4, max: 16, weight: 2, cd: 5, when: is('glot') },
        { name: 'swallow', use: () => this.skill3(), min: 4, max: 13, weight: 2.2, cd: 8, when: is('glot') },
        { name: 'army', use: () => this.release(), min: 0, max: 16, weight: 3, cd: 25, when: () => this.form === 'glot' && this.f.hp / this.f.maxHp < 0.7 },
        { name: 'guard', use: () => this.toggle(), min: 0, max: 99, weight: 5, cd: 12, when: () => this.form === 'glot' && this.head === 'capsule' && this.g.time - this.f.lastHurt.at < 0.6 && this.f.lastHurt.dmg > 40 },
        { name: 'gloat', use: () => this.gloat(), min: 0, max: 99, weight: 8, cd: 14, when: () => this.g.time - this.bigHitAt < 0.8 && this.form !== 'glot' },
      ],
    };
  }

  /** arrogance: a big hit landed, he stops to savour it */
  private gloat(): void {
    const { f, g } = this;
    if (this.cd.gloat > 0 || f.busy) return;
    this.cd.gloat = 14;
    f.act(new GloatAction(), true);
    const lines = this.form === 'true' ? ['"Hahaha! Did that hurt?"', '"How delicious you will be."'] : ['"What\'s wrong? Hit me back."', '"Ha! You\'re as slow as ever."'];
    g.hud?.showBanner(lines[Math.floor(Math.random() * lines.length)], 1.6);
  }

  abilities(): AbilityInfo[] {
    const f = this.f;
    switch (this.form) {
      case 'true':
        return [
          { key: 'LMB', name: 'Maw', kanji: '喰' },
          { key: 'RMB', name: 'Devour', kanji: '吸収', cost: 8, cd: this.cd.devour, cdMax: 2.5 },
          { key: 'Q', name: 'Fusion', kanji: '霊融', cost: 22, cd: this.cd.fusion, cdMax: 7 },
          { key: 'E', name: 'Kaien', kanji: '海燕', cost: 8, cd: this.cd.aspect, cdMax: 2, active: this.lit ? false : undefined },
          { key: 'R', name: 'Destruction', kanji: '破壊', cost: 20, cd: this.cd.arm, cdMax: 9, active: this.destructT > 0, timer: this.destructT > 0 ? this.destructT / 6 : undefined, tint: '#c94dff' },
          { key: 'G', name: this.maskOn ? 'Mask' : 'Capsule', kanji: '面', active: this.maskOn },
          { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
          { key: 'F', name: 'Glotonería', kanji: '喰虚', cost: 40, tint: '#c94dff' },
        ];
      case 'kaien':
        return [
          { key: 'LMB', name: 'Sword', kanji: '剣' },
          { key: 'RMB', name: 'Thrust', kanji: '突', cost: 8, cd: this.cd.thrust, cdMax: 2.5 },
          { key: 'Q', name: 'Shakkahō', kanji: '赤火砲', cost: 10, cd: this.cd.shakkaho, cdMax: 1.4 },
          { key: 'E', name: 'Mask', kanji: '面', cd: this.cd.aspect, cdMax: 2 },
          { key: 'R', name: 'Rapid Kidō', kanji: '連', cost: 22, cd: this.cd.rapid, cdMax: 5 },
          { key: 'F', name: 'Nejibana', kanji: '捩花', cost: 30, tint: '#7fd0ff' },
          { key: 'G', name: 'Glotonería', kanji: '喰虚', cost: 40, tint: '#c94dff' },
          { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
        ];
      case 'nejibana':
        return [
          { key: 'LMB', name: 'Spear Dance', kanji: '捩花' },
          { key: 'RMB', name: 'Crushing Tide', kanji: '潮', cost: 16, cd: this.cd.tide, cdMax: 4 },
          { key: 'Q', name: 'Rising Wave', kanji: '波', cost: 18, cd: this.cd.wave, cdMax: 4 },
          { key: 'E', name: 'Mask', kanji: '面', cd: this.cd.aspect, cdMax: 2 },
          { key: 'R', name: 'Spiral', kanji: '螺旋', cost: 24, cd: this.cd.spiral, cdMax: 6 },
          { key: 'F', name: 'Glotonería', kanji: '喰虚', cost: 40, tint: '#c94dff' },
          { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
        ];
      default:
        return [
          { key: 'LMB', name: 'Tentacles', kanji: '触' },
          { key: 'RMB', name: this.lit ? 'Cero' : 'Impale', kanji: this.lit ? '虚閃' : '貫', cost: this.lit ? 22 : 14, cd: this.lit ? this.cd.cero : this.cd.impale, cdMax: this.lit ? 4 : 3 },
          { key: 'Q', name: 'Horde', kanji: '群', cost: 26, cd: this.cd.horde, cdMax: 10 },
          { key: 'E', name: 'Tidal Sweep', kanji: '薙', cost: 18, cd: this.cd.sweep, cdMax: 4 },
          { key: 'R', name: 'Swallow', kanji: '呑', cost: 24, cd: this.cd.swallow, cdMax: 8 },
          { key: 'F', name: '33,650', kanji: '軍', cost: 60, cd: this.cd.army, cdMax: 25, tint: '#c94dff' },
          { key: 'G', name: 'Guard', kanji: '守', cost: 10, active: f.action instanceof GuardAction, cd: this.cd.guard, cdMax: 6 },
          { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
        ];
    }
  }
}
