// Zommari Rureaux's kit (docs/kits/zommari.md). Sealed Séptima: the fastest Sonído and Gemelos Sonído — copies of
// him left round the target, solid, bleeding when cut, fighting with his sword; the triangulated cut he makes with
// two of them; the substitution; every copy at once; the meditation. F: "Shizumare, Brujería" — the sword folds in the
// air, foam swallows him and he sits on the bulb, fifty eyes on his body. Amor: whatever his gaze takes (a sun mark
// prints on it) obeys him — legs that walk their owner to him, an arm that will not answer, a head that holds its
// own blade to its throat, the blades and shots in his sight. The forehead eyes; El Embrion, which blinds the body.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { Game } from '../game';
import type { Kit, KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { DuelistAI } from '../ai/duelist';
import { KATANA_BASE_Z, KATANA_TIP_Z, zommariAsset, zommariProp } from '../../chars/zommari';
import { BRUJERIA_CLIPS, BRUJERIA_STANCE, ZOMMARI_CHAIN, ZOMMARI_CLIPS, ZOMMARI_STANCE } from '../../chars/zommariClips';
import { registerReactions } from '../../chars/reactionClips';
import { raycastVoxels } from '../../voxel/raycast';
import { TEX_GLOW } from '../../vfx/sprites';
import type { AuraStyle } from '../../vfx/aura';
import { amorGlint, bleed, copyVanish, embrionPulse, foam, FoldingSword, gazeStreak, MARK_AT, SunMark, ZOMMARI_PINK } from '../../vfx/brujeria';

export const AURA_ZOMMARI: AuraStyle = ZOMMARI_PINK;
const AURA_BRUJERIA: AuraStyle = { core: '#F1DCFF', body: '#C77DFF', rim: '#5E2A8E' };

const BLADE: NonNullable<FighterDef['blade']> = { prop: 'sword', base: [0, 0, KATANA_BASE_Z], tip: [0, 0, KATANA_TIP_Z], color: '#F27DB8', core: '#FFE6F2' };
/** the fastest Sonído of the Espada: the longest blink */
const SPEED_SEALED = { run: 9.5, sprint: 24, jump: 12, dash: 16, dashTime: 0.09 };
/** on the bulb: a slow hover, a short gliding Sonído, no jumps */
const SPEED_BRUJERIA = { run: 3.6, sprint: 6, jump: 0, dash: 7, dashTime: 0.3 };

const sealedProps = () => [
  { key: 'sword', model: zommariProp('katana'), socket: 'grip.R' },
  { key: 'saya', model: zommariProp('sheath'), socket: 'hip.L' },
];

export const ZOMMARI_DEF: FighterDef = {
  id: 'zommari',
  name: 'Zommari Rureaux',
  title: 'Séptima Espada',
  build: () => ({ asset: zommariAsset('sealed'), props: sealedProps() }),
  stance: ZOMMARI_STANCE,
  clips: ZOMMARI_CLIPS,
  aura: AURA_ZOMMARI,
  blade: BLADE,
  hp: 1100,
  rei: 200,
  speed: { ...SPEED_SEALED },
  radius: 0.4,
  height: 1.96,
};

/** a copy: him in every way but how much it can take */
function copyDef(): FighterDef {
  return { ...ZOMMARI_DEF, id: 'zommari-copy', hp: 60, rei: 40, speed: { ...SPEED_SEALED } };
}

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

const spec = (damage: number, knock: number, cut: number, extra: Partial<BladeSpec> = {}): BladeSpec => ({ damage, knock, launch: 0, hitstop: 0.05, shake: 0.12, cut, ...extra });

/** blade windows of each sword move (clip time) */
const MOVES: Record<string, { at: [number, number]; spec: BladeSpec }> = {
  zm_s1: { at: [0.1, 0.2], spec: spec(24, 6, 300, { reach: 0.16 }) },
  zm_s2: { at: [0.1, 0.22], spec: spec(22, 4, 320, { launch: 7, reach: 0.12 }) },
  zm_s3: { at: [0.11, 0.23], spec: spec(24, 8, 320, { reach: 0.12 }) },
  zm_s4: { at: [0.16, 0.31], spec: spec(34, 12, 420, { heavy: true, hitstop: 0.08, shake: 0.22, reach: 0.14 }) },
  zm_tri: { at: [0.1, 0.21], spec: spec(26, 9, 340, { heavy: true, hitstop: 0.07, shake: 0.2, reach: 0.14 }) },
};

/** what a sword-swinging body needs from its kit */
interface Swordsman {
  readonly f: Fighter;
  chain(i: number): void;
}

/** Marker for the skills a string can cancel into. */
abstract class SkillAction extends FighterAction {
  protected dur = 1;
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= this.dur) this.done = true;
  }
}

/** One cut (the string, the triangulated cut): the step in, the blade window, the chain on input. */
class CutAction extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private opened = false;
  queued = false;
  constructor(readonly host: Swordsman | null, readonly clip: string, readonly index: number, private lunge = 6) {
    super();
    this.name = clip;
    this.mobility = 0.12;
    this.airGravity = 0.12;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    f.bladeHits.clear();
    const tgt = f.faceTarget;
    const gap = tgt ? Math.max(0, Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z) - 1.4) : 0;
    f.push.addScaledVector(f.forward(_v), Math.min(this.lunge + gap * 3, 14));
    f.anim.play(this.clip, { onEvent: (n) => n === 'step' && g.sfx.play('step', f.pos, 0.4) });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    const m = MOVES[this.clip];
    if (!this.opened && t >= m.at[0] - 0.03) {
      this.opened = true;
      f.bladeHits.clear();
      f.bladeSpec = m.spec;
      g.sfx.play(this.index === 3 ? 'swingHeavy' : 'swing', f.center(), 0.8);
    }
    f.bladeActive = t >= m.at[0] && t <= m.at[1];
    if (f.trail) f.trail.emitting = t >= m.at[0] - 0.03 && t <= m.at[1] + 0.02;
    if (this.queued && t >= this.comboAt && this.host) {
      this.done = true;
      this.host.chain(this.index + 1);
      return;
    }
    if (t >= this.dur) this.done = true;
  }
  override end(f: Fighter): void {
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }
  override canCancel(next: FighterAction): boolean {
    const w = MOVES[this.clip].at[1];
    if (next.name === 'dash') return this.t >= w;
    return next instanceof SkillAction && this.t >= w + 0.03;
  }
}

// ------------------------------------------------------------------------------------------------ the copies

/** A Gemelos copy's kit: his sword string, nothing else (the copies are him, for a few seconds). */
class CopyKit implements Kit, Swordsman {
  private combo = 0;
  private lastEnd = 0;
  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.toughness = 0;
  }
  update(): void {}
  attack(): void {
    const f = this.f;
    if (f.action instanceof CutAction) {
      f.action.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastEnd > 0.8) this.combo = 0;
    this.chain(this.combo);
  }
  chain(i: number): void {
    const idx = i % ZOMMARI_CHAIN.length;
    this.combo = idx + 1;
    this.lastEnd = this.g.time + 0.8;
    this.f.act(new CutAction(this, ZOMMARI_CHAIN[idx], idx), true);
  }
  heavy(): void {}
  skill1(): void {}
  release(): void {}
  toggleFlare(): void {}
  abilities(): AbilityInfo[] {
    return [];
  }
  formName(): string {
    return 'Gemelos Sonído';
  }
  ai(): KitAI {
    return { reach: 1.7, chain: 4, moves: [] };
  }
}

/** Gemelos Sonído: he blinks behind the target and leaves copies of himself round it. */
class GemelosAction extends SkillAction {
  readonly name = 'gemelos';
  constructor(readonly kit: ZommariKit, readonly target: Fighter | null) {
    super();
    this.invulnerable = true;
    this.dur = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    const k = this.kit;
    const t = this.target;
    g.callout('双児響転', 'GEMELOS SONÍDO', '#ff9ad0');
    g.sfx.play('shunpo', f.center(), 1);
    const n = Math.min(3, 5 - k.copies.length);
    const from = f.pos.clone();
    if (t) {
      const back = t.forward().multiplyScalar(-2);
      k.blinkTo(new THREE.Vector3(t.pos.x + back.x, Math.max(t.pos.y, f.pos.y - 0.5), t.pos.z + back.z), t.pos);
      const base = Math.atan2(from.x - t.pos.x, from.z - t.pos.z);
      for (let i = 0; i < n; i++) {
        // the first where he stood (his "image" stays in front), the rest round the target
        const a = base + (i === 0 ? 0 : (i % 2 ? 1 : -1) * (0.9 + Math.floor((i - 1) / 2) * 0.9));
        const r = i === 0 ? Math.min(6, from.distanceTo(t.pos)) : 2.4;
        k.spawnCopy(new THREE.Vector3(t.pos.x + Math.sin(a) * r, t.pos.y + 0.2, t.pos.z + Math.cos(a) * r), t.pos, 8);
      }
    } else {
      for (let i = 0; i < n; i++) {
        const a = f.yaw + (i - (n - 1) / 2) * 0.9;
        k.spawnCopy(new THREE.Vector3(f.pos.x + Math.sin(a) * 2.5, f.pos.y + 0.2, f.pos.z + Math.cos(a) * 2.5), null, 8);
      }
    }
    f.anim.play('zm_gemelos');
  }
}

/** The triangulated cut: two copies appear on two more sides of the target and all three cut at once. */
class TriAction extends SkillAction {
  readonly name = 'tri';
  private cut: CutAction | null = null;
  constructor(readonly kit: ZommariKit, readonly target: Fighter | null) {
    super();
  }
  override start(f: Fighter, g: Game): void {
    const t = this.target;
    this.dur = 0.5;
    if (t) {
      const base = Math.atan2(f.pos.x - t.pos.x, f.pos.z - t.pos.z);
      this.kit.blinkTo(new THREE.Vector3(t.pos.x + Math.sin(base) * 1.6, t.pos.y, t.pos.z + Math.cos(base) * 1.6), t.pos);
      for (const da of [2.1, -2.1]) {
        const a = base + da;
        const c = this.kit.spawnCopy(new THREE.Vector3(t.pos.x + Math.sin(a) * 1.6, t.pos.y + 0.1, t.pos.z + Math.cos(a) * 1.6), t.pos, 0.9, false);
        if (c) c.act(new CutAction(null, 'zm_tri', 1, 2), true);
      }
    }
    this.cut = new CutAction(null, 'zm_tri', 1, 2);
    this.cut.start(f, g);
    g.sfx.play('shunpo', f.center(), 0.9);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.cut?.update(f, g, dt);
  }
  override end(f: Fighter, g: Game): void {
    this.cut?.end(f);
    void g;
  }
}

/** All sides: every copy lunges at the target at once. */
class AssaultAction extends SkillAction {
  readonly name = 'assault';
  constructor(readonly kit: ZommariKit, readonly target: Fighter | null) {
    super();
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip('zm_assault')!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play('zm_assault', {
      onEvent: (n) => {
        if (n !== 'go') return;
        const t = this.target;
        for (const cp of this.kit.copies) {
          const o = cp.f;
          if (o.dead) continue;
          o.stopAction();
          o.hitstun = 0;
          if (t) {
            o.faceTarget = t.center();
            o.yaw = Math.atan2(t.pos.x - o.pos.x, t.pos.z - o.pos.z);
          }
          o.act(new CutAction(null, 'zm_s4', 3, 10), true);
        }
        g.sfx.play('shunpo', f.center(), 1);
      },
    });
  }
}

/** Meditation: hands together, rooted; he heals and gathers reiatsu until he moves or is struck. */
class PrayAction extends SkillAction {
  readonly name = 'pray';
  constructor(readonly kit: ZommariKit) {
    super();
    this.mobility = 0;
    this.trackTarget = false;
    this.dur = 8;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('zm_pray', { hold: true });
    g.sfx.play('heal', f.center(), 0.6);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t > 0.4 && f.wish.lengthSq() > 0.2) {
      this.done = true;
      return;
    }
    f.hp = Math.min(f.maxHp, f.hp + 25 * dt);
    f.rei = Math.min(f.maxRei, f.rei + 12 * dt);
    if (Math.random() < dt * 8) {
      const c = f.center();
      g.engine.glow.spawn({ x: c.x + (Math.random() - 0.5) * 0.8, y: f.pos.y + Math.random() * 1.6, z: c.z + (Math.random() - 0.5) * 0.8, vx: 0, vy: 0.8, vz: 0, size: 0.14, sizeEnd: 0.03, life: 0.8, r: 0.95, g: 0.6, b: 0.8, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
    }
  }
  override end(f: Fighter): void {
    f.anim.stopAll(0.25);
  }
}

/** "Shizumare, Brujería": the sword let go and folding in the air, the clap, the head twisted, the foam. */
class ReleaseAction extends SkillAction {
  readonly name = 'release';
  private swapped = false;
  constructor(readonly kit: ZommariKit) {
    super();
    this.invulnerable = true;
    this.trackTarget = false;
    this.dur = 2.6;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('zm_release', {
      onEvent: (n) => {
        if (n === 'let') {
          f.visual.detach('sword');
          f.bladeValid = false;
          g.addProjectile(new FoldingSword(g, () => {
            const c = f.center(_w);
            const fw = f.forward(_v);
            return { pos: new THREE.Vector3(c.x + fw.x * 0.55, c.y + 0.18, c.z + fw.z * 0.55), yaw: f.yaw };
          }, 1.5));
          g.callout('鎮まれ「呪眼僧伽」', 'SHIZUMARE, BRUJERÍA', '#e6a3ff');
        }
        if (n === 'clap') {
          g.sfx.play('crack', f.center(), 0.9);
          f.aura.flare(1.6, 0.6);
        }
        if (n === 'twist') g.sfx.play('crack', f.center(), 0.6);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t > 1.0 && this.t < 1.9) foam(g, f, 0.6);
    if (!this.swapped && this.t >= 1.45) {
      this.swapped = true;
      this.kit.becomeBrujeria();
      f.anim.play('zb_reveal');
    }
  }
}

// ------------------------------------------------------------------------------------------------ Amor

type Limb = 'legs' | 'arm' | 'head';

interface Hold {
  o: Fighter;
  limb: Limb;
  until: number;
  marks: SunMark[];
  rooted: boolean;
  nextSelfHit: number;
}

/** A gaze: the eye glows purple (the tell), then whatever is under it is his. */
class GazeAction extends SkillAction {
  readonly name: string;
  private fired = false;
  private at = 0.3;
  constructor(readonly kit: ZommariKit, readonly clip: string, readonly cast: () => void, readonly from: 'palm' | 'brow' = 'palm') {
    super();
    this.name = clip;
    this.mobility = 0.15;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.at = c.events.gaze ?? c.events.volley ?? 0.3;
    f.anim.play(this.clip);
    void g;
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (!this.fired && this.t < this.at && Math.random() < dt * 14) amorGlint(g, this.kit.eyePos(this.from), 0.8);
    if (!this.fired && this.t >= this.at) {
      this.fired = true;
      this.cast();
    }
  }
}

/** El Embrion: the bulb closes over him; almost nothing gets through. G again opens it; then the body eyes are blind. */
class EmbrionAction extends SkillAction {
  readonly name = 'embrion';
  constructor(readonly kit: ZommariKit) {
    super();
    this.mobility = 0;
    this.armor = 0.95;
    this.trackTarget = false;
    this.dur = 5;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('zb_embrion', { hold: true });
    f.visual.attach('embrion', zommariProp('embrion'), 'embrion');
    const p = f.visual.props.get('embrion');
    if (p) p.scale.setScalar(0.2);
    g.callout('守胚姿勢', 'EL EMBRION', '#ff9ad0');
    g.sfx.play('splash', f.center(), 0.8);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const p = f.visual.props.get('embrion');
    if (p) p.scale.setScalar(Math.min(1, 0.2 + this.t * 3.2));
    if (this.t > 0.25 && this.t < 0.3) embrionPulse(g, f.center(), f.def.height * 0.55);
  }
  override end(f: Fighter, g: Game): void {
    f.visual.detach('embrion');
    f.anim.stopAll(0.3);
    embrionPulse(g, f.center(), f.def.height * 0.55);
    this.kit.blind();
  }
}

// ------------------------------------------------------------------------------------------------ the kit

export class ZommariKit implements Kit, Swordsman {
  form: 'sealed' | 'brujeria' = 'sealed';
  comboIndex = 0;
  flare = false;
  readonly copies: { f: Fighter; until: number }[] = [];
  readonly holds: Hold[] = [];
  /** the body eyes blinded after El Embrion (s left): only the forehead eyes work */
  blindT = 0;
  private fading: SunMark[] = [];
  private lastSwingEnd = 0;
  private cd = { gemelos: 0, tri: 0, swap: 0, assault: 0, pray: 0, palm: 0, march: 0, legs: 0, head: 0, objects: 0, forehead: 0, embrion: 0 };
  private preached = false;
  private mourned = false;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.toughness = 10;
    f.onHurt = (amount, heavy) => this.hurt(amount, heavy);
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    if (this.blindT > 0 && (this.blindT -= dt) <= 0) this.see();
    if (this.blindT > 0 && Math.random() < dt * 3) bleed(g, f.center().setY(f.pos.y + f.def.height * 0.75), f.forward(_v), 2);
    this.tendCopies();
    this.tendHolds(dt);
    for (let i = this.fading.length - 1; i >= 0; i--) if (!this.fading[i].update(dt, true)) this.fading.splice(i, 1);
    if (f.dead && !this.mourned) {
      this.mourned = true;
      this.releaseAll();
      for (const c of [...this.copies]) this.dropCopy(c.f);
      if (g.hud) g.hud.showBanner('"Aizen-sama…"', 2.5);
    }
  }

  // ---------------------------------------------------------------------------------------------- the copies

  /** a copy of him at p, facing `look`, gone after `life` s; `fight`: a duel AI drives it */
  spawnCopy(p: THREE.Vector3, look: THREE.Vector3 | null, life: number, fight = true): Fighter | null {
    const { f, g } = this;
    if (this.copies.length >= 5) return null;
    const c = g.spawn(copyDef(), p, f.team);
    if (look) c.yaw = Math.atan2(look.x - p.x, look.z - p.z);
    else c.yaw = f.yaw;
    const kit = new CopyKit(c, g);
    c.onHurt = () => bleed(g, c.center(), c.forward().negate(), 8);
    c.aura.target = f.aura.target;
    if (fight) g.controllers.push(new DuelistAI(g, c, kit, { aggression: 0.95, intro: 0 }));
    c.data.copyOf = f;
    this.copies.push({ f: c, until: g.time + life });
    c.ghosts.spawn(0.35, 0.8);
    return c;
  }

  private dropCopy(c: Fighter): void {
    const i = this.copies.findIndex((x) => x.f === c);
    if (i >= 0) this.copies.splice(i, 1);
    if (!this.g.fighters.includes(c)) return;
    copyVanish(this.g, c);
    c.hp = 0;
    c.dead = true;
    c.stopAction();
    this.g.remove(c);
  }

  private tendCopies(): void {
    const g = this.g;
    for (const c of [...this.copies]) {
      if (!g.fighters.includes(c.f)) {
        this.copies.splice(this.copies.indexOf(c), 1);
        continue;
      }
      if (c.f.dead || g.time >= c.until) this.dropCopy(c.f);
    }
  }

  /** the Sonído: gone from here and there at once, no trail */
  blinkTo(p: THREE.Vector3, look: THREE.Vector3 | null): void {
    const { f, g } = this;
    f.ghosts.spawn(0.3, 0.7);
    f.body.pos.copy(p);
    f.body.prev.copy(p);
    if (look) f.yaw = Math.atan2(look.x - p.x, look.z - p.z);
    g.onDash(f);
  }

  /** E: the substitution — he and his nearest copy trade places */
  private swap(): void {
    const { f, g } = this;
    let best: Fighter | null = null, bd = Infinity;
    for (const c of this.copies) {
      const d = c.f.pos.distanceTo(f.pos);
      if (!c.f.dead && d < bd) { bd = d; best = c.f; }
    }
    if (!best) {
      // no copy to trade with: a Sonído away, leaving one where he stood
      const from = f.pos.clone();
      const back = f.forward(_v).multiplyScalar(-7);
      this.blinkTo(new THREE.Vector3(f.pos.x + back.x, f.pos.y, f.pos.z + back.z), from);
      this.spawnCopy(from, null, 6);
      return;
    }
    const a = f.pos.clone(), b = best.pos.clone();
    f.ghosts.spawn(0.3, 0.7);
    best.ghosts.spawn(0.3, 0.7);
    f.body.pos.copy(b);
    f.body.prev.copy(b);
    best.body.pos.copy(a);
    best.body.prev.copy(a);
    g.sfx.play('shunpo', f.center(), 0.8);
  }

  // ---------------------------------------------------------------------------------------------- Amor

  /** where a gaze leaves him from */
  eyePos(from: 'palm' | 'brow'): THREE.Vector3 {
    return sock(this.f, from === 'palm' ? 'palm.R' : 'brow');
  }

  /** the line of sight from his eyes to o: walls, barriers and dust in between take the gaze instead */
  private sees(o: Fighter, from: THREE.Vector3): THREE.Vector3 | null {
    const c = o.center();
    const d = _w.subVectors(c, from);
    const len = d.length();
    d.divideScalar(len || 1);
    const hit = raycastVoxels(this.g.engine.world, from.x, from.y, from.z, d.x, d.y, d.z, len);
    if (hit && hit.dist < len - o.def.radius) return from.clone().addScaledVector(d, hit.dist);
    return null;
  }

  /** whoever his gaze should land on: the crosshair's (or the AI's) target, else the nearest in front */
  target(range = 40): Fighter | null {
    const { f, g } = this;
    return g.nearestEnemy(f, range, f.forward(), 50) ?? g.nearestEnemy(f, range);
  }

  holdOn(o: Fighter, limb: Limb): Hold | undefined {
    return this.holds.find((h) => h.o === o && h.limb === limb);
  }

  /** the gaze lands: the sun mark prints on the limb and it is his (false: missed or blocked) */
  amor(o: Fighter | null, limb: Limb, from: 'palm' | 'brow' = 'palm', dur = limb === 'head' ? 4 : 6): boolean {
    const { f, g } = this;
    if (!o || o.dead) return false;
    const eye = this.eyePos(from);
    const blocked = this.sees(o, eye);
    if (blocked) {
      // the gaze takes the wall instead (Dankū caught the mark)
      gazeStreak(g, eye, blocked);
      g.engine.glow.spawn({ x: blocked.x, y: blocked.y, z: blocked.z, size: 0.8, sizeEnd: 0.1, life: 0.5, r: 0.65, g: 0.3, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
      return false;
    }
    gazeStreak(g, eye, o.center());
    // a Sonído or Shunpo at the instant it lands: it took nothing
    if (o.invuln > 0 || o.action?.invulnerable) return false;
    if (this.holds.length >= 58) return false;
    const old = this.holdOn(o, limb);
    if (old) {
      old.until = Math.max(old.until, g.time + dur);
      return true;
    }
    const marks = limb === 'legs' ? [new SunMark(o, MARK_AT.legL), new SunMark(o, MARK_AT.legR)] : [new SunMark(o, limb === 'arm' ? MARK_AT.arm : MARK_AT.head)];
    const h: Hold = { o, limb, until: g.time + dur, marks, rooted: false, nextSelfHit: g.time + 1.4 };
    this.holds.push(h);
    g.sfx.play('ting', o.center(), 0.7);
    if (limb === 'head') {
      // the whole body: it drops what it held... into its own throat
      registerReactions(o.anim);
      o.stopAction();
      o.anim.play('amor_hostage', { hold: true });
      g.callout('愛', 'AMOR', '#c77dff');
    }
    if (f === g.player || o === g.player) g.hud?.showBanner(limb === 'legs' ? 'Your legs are his' : limb === 'arm' ? 'Your arm is his' : 'Your body is his', 1.4);
    return true;
  }

  private releaseHold(h: Hold, cut = false): void {
    const i = this.holds.indexOf(h);
    if (i >= 0) this.holds.splice(i, 1);
    // a head held to the end: the blade is drawn across before the body is given back
    if (cut && h.limb === 'head' && !h.o.dead) {
      this.g.damage(h.o, 60, this.f, h.o.forward(_v).negate().clone(), { heavy: true, unblockable: true, hitstop: 0.08 });
      bleed(this.g, sock(h.o, 'face'), h.o.forward(_v), 16);
    }
    if (h.rooted) h.o.rooted = false;
    if (h.limb === 'head' && !h.o.dead) h.o.anim.stopAll(0.3);
    this.fading.push(...h.marks);
  }

  private releaseAll(): void {
    for (const h of [...this.holds]) this.releaseHold(h);
  }

  private tendHolds(dt: number): void {
    const { f, g } = this;
    for (const h of [...this.holds]) {
      const o = h.o;
      if (o.dead || f.dead || g.time >= h.until || !g.fighters.includes(o)) {
        this.releaseHold(h, g.time >= h.until && !f.dead);
        continue;
      }
      for (const m of h.marks) m.update(dt, false);
      if (h.limb === 'legs') {
        // the legs walk their owner to him; a body bound by Kidō or a construct cannot be moved
        if (!h.rooted && !o.rooted) {
          o.rooted = true;
          h.rooted = true;
        }
        if (!h.rooted) continue;
        o.dashT = 0;
        o.hovering = false;
        _v.subVectors(f.pos, o.pos).setY(0);
        const d = _v.length();
        if (d > f.def.radius + o.def.radius + 1.2) o.push.addScaledVector(_v.divideScalar(d), 2.6 * o.pushDrag * dt);
      } else if (h.limb === 'arm') {
        o.armLockT = Math.max(o.armLockT, 0.2);
        // now and then the seized arm strikes its own owner, with its owner's own strength
        if (g.time >= h.nextSelfHit) {
          h.nextSelfHit = g.time + 1.1;
          g.damage(o, (26 * o.power) / Math.max(0.1, f.power), f, o.forward(_v).negate().clone(), { knock: 2, unblockable: true });
          bleed(g, sock(o, 'grip.R'), o.forward(_v), 6);
        }
      } else {
        // the head: the whole body his — frozen, its own blade at its throat
        if (!h.rooted && !o.rooted) {
          o.rooted = true;
          h.rooted = true;
        }
        o.armLockT = Math.max(o.armLockT, 0.2);
        o.hitstun = Math.max(o.hitstun, 0.12);
        o.wish.set(0, 0, 0);
        g.drain(o, 30 * dt, f);
        if (Math.random() < dt * 6) bleed(g, sock(o, 'face').setY(o.pos.y + o.def.height * 0.8), o.forward(_v), 2);
      }
    }
  }

  // ---------------------------------------------------------------------------------------------- the eyes blinded

  blind(): void {
    const f = this.f;
    if (this.form !== 'brujeria') return;
    this.blindT = 12;
    this.swapBody('blind');
    if (f === this.g.player) this.g.hud?.showBanner('The body eyes are blind — only the forehead eyes see', 2);
  }

  private see(): void {
    this.blindT = 0;
    if (this.form === 'brujeria') this.swapBody('brujeria');
  }

  private swapBody(asset: 'brujeria' | 'blind'): void {
    const f = this.f;
    const lv = f.aura.level;
    f.setForm({ asset: zommariAsset(asset), props: [] }, AURA_BRUJERIA);
    f.aura.level = lv;
    f.aura.target = this.flare ? 1 : 0.35;
  }

  // ---------------------------------------------------------------------------------------------- forms

  becomeBrujeria(): void {
    const { f, g } = this;
    this.form = 'brujeria';
    for (const c of [...this.copies]) this.dropCopy(c.f);
    f.def = { ...f.def, stance: BRUJERIA_STANCE, clips: BRUJERIA_CLIPS, speed: { ...SPEED_BRUJERIA }, radius: 1.15, height: 2.67 };
    f.anim.stopAll(0.05);
    f.setForm({ asset: zommariAsset('brujeria'), props: [] }, AURA_BRUJERIA);
    f.body.hw = 0.45;
    f.body.h = 2.4;
    f.giant = true;
    f.hovering = false;
    f.hp = f.maxHp;
    // the bulb takes a blow well
    f.damageTaken = 0.85;
    f.power = 1.2 * (this.flare ? 1.25 : 1);
    f.toughness = 14;
    f.aura.flare(2.2, 1.2);
    f.aura.target = this.flare ? 1 : 0.35;
    foam(g, f, 2);
    g.sfx.play('bankai', f.center(), 1);
    g.shake(0.4);
  }

  // ---------------------------------------------------------------------------------------------- inputs

  private hurt(amount: number, heavy: boolean): void {
    const { f, g } = this;
    // he bleeds like his copies: nobody can tell
    if (amount > 4) bleed(g, f.center(), f.forward(_v).negate(), 6);
    if (f.action instanceof PrayAction) f.stopAction();
    // a heavy blow on him breaks one hold
    if (heavy && this.holds.length) this.releaseHold(this.holds[0]);
  }

  private special(a: FighterAction, cost: number, cdKey: keyof ZommariKit['cd'], cd: number): boolean {
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

  /** the body eyes are blind: only the forehead eyes (F) work */
  private eyesOpen(): boolean {
    if (this.blindT <= 0) return true;
    if (this.f === this.g.player) this.g.hud?.showBanner('The body eyes are blind');
    return false;
  }

  attack(): void {
    const f = this.f;
    if (this.form === 'brujeria') {
      if (!this.eyesOpen()) return;
      const t = this.target(30);
      this.special(new GazeAction(this, 'zb_palm', () => this.amor(t, 'arm')), 6, 'palm', 1.2);
      return;
    }
    const cur = f.action;
    if (cur instanceof CutAction) {
      cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastSwingEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const idx = i % ZOMMARI_CHAIN.length;
    this.comboIndex = idx + 1;
    this.lastSwingEnd = this.g.time + 0.8;
    this.f.act(new CutAction(this, ZOMMARI_CHAIN[idx], idx), true);
  }

  /** RMB: the triangulated cut (sealed) / the forced march (Brujería) */
  heavy(): void {
    const t = this.target(this.form === 'sealed' ? 10 : 40);
    if (this.form === 'sealed') {
      this.special(new TriAction(this, t), 14, 'tri', 4);
      return;
    }
    if (!this.eyesOpen()) return;
    this.special(new GazeAction(this, 'zb_march', () => {
      if (!t) return;
      if (!this.holdOn(t, 'legs')) this.amor(t, 'legs');
      // the beckoning hand: a strong step toward him
      const h = this.holdOn(t, 'legs');
      if (h && h.rooted) t.push.addScaledVector(_v.subVectors(this.f.pos, t.pos).setY(0).normalize(), 7);
    }), 8, 'march', 2);
  }

  /** Q: Gemelos Sonído (sealed) / Amor on the legs (Brujería) */
  skill1(): void {
    if (this.form === 'sealed') {
      this.special(new GemelosAction(this, this.target(30)), 18, 'gemelos', 5);
      return;
    }
    if (!this.eyesOpen()) return;
    const t = this.target(40);
    this.special(new GazeAction(this, 'zb_amor', () => this.amor(t, 'legs')), 14, 'legs', 3);
  }

  /** E: the substitution (sealed) / Amor on the head (Brujería) */
  skill2(): void {
    const { f } = this;
    if (this.form === 'sealed') {
      if (this.cd.swap > 0 || f.dead || !f.spendRei(6)) return;
      this.cd.swap = 1.5;
      this.swap();
      return;
    }
    if (!this.eyesOpen()) return;
    const t = this.target(30);
    this.special(new GazeAction(this, 'zb_head', () => {
      if (this.amor(t, 'head') && t) t.disarmT = Math.max(t.disarmT, 4);
    }), 30, 'head', 7);
  }

  /** R: every copy at once (sealed) / Amor on objects (Brujería) */
  skill3(): void {
    const { f, g } = this;
    if (this.form === 'sealed') {
      if (!this.copies.length) {
        if (f === g.player) g.hud?.showBanner('No copies out');
        return;
      }
      this.special(new AssaultAction(this, this.target(30)), 10, 'assault', 4);
      return;
    }
    if (!this.eyesOpen()) return;
    this.special(new GazeAction(this, 'zb_object', () => {
      // shots and blades in his gaze are seized and dropped; the target's weapon is taken from its hand
      const eye = this.eyePos('palm');
      const fw = f.forward(_v);
      let n = 0;
      for (let d = 2; d <= 30; d += 3.5) n += g.rejectNear(eye.clone().addScaledVector(fw, d), 2.2 + d * 0.12, f, false);
      const t = this.target(30);
      if (t && !this.sees(t, eye)) {
        t.disarmT = Math.max(t.disarmT, 4);
        gazeStreak(g, eye, t.center());
      }
      if (n) g.sfx.play('ting', eye, 0.8);
    }), 12, 'objects', 5);
  }

  /** F: "Shizumare, Brujería" (sealed) / the forehead eyes (Brujería; they still see when the body is blind) */
  release(): void {
    const { f, g } = this;
    if (this.form === 'sealed') {
      if (f.busy) return;
      if (!f.spendRei(40)) {
        if (f === g.player) g.hud?.showBanner('Not enough reiatsu');
        return;
      }
      f.act(new ReleaseAction(this), true);
      return;
    }
    this.special(new GazeAction(this, 'zb_forehead', () => {
      const eye = this.eyePos('brow');
      amorGlint(g, eye, 1.6);
      const fw = f.forward(_v);
      for (const o of g.enemiesOf(f)) {
        _w.subVectors(o.pos, f.pos).setY(0);
        const d = _w.length();
        if (d > 30 || (d > 1 && _w.normalize().dot(fw) < Math.cos((25 * Math.PI) / 180))) continue;
        this.amor(o, 'legs', 'brow');
      }
    }, 'brow'), 20, 'forehead', 6);
  }

  /** G: meditation (sealed) / El Embrion (Brujería; G again opens it) */
  toggle(): void {
    const { f } = this;
    const cur = f.action;
    if (cur instanceof PrayAction || cur instanceof EmbrionAction) {
      f.stopAction();
      return;
    }
    if (this.form === 'sealed') this.special(new PrayAction(this), 0, 'pray', 4);
    else this.special(new EmbrionAction(this), 25, 'embrion', 14);
  }

  toggleFlare(): void {
    const { f, g } = this;
    this.flare = !this.flare;
    f.power = (this.form === 'brujeria' ? 1.2 : 1) * (this.flare ? 1.25 : 1);
    f.aura.target = this.flare ? 1 : this.form === 'brujeria' ? 0.35 : 0.15;
    if (this.flare) {
      f.aura.flare(1.6, 0.4);
      g.shake(0.2);
      g.sfx.play('flare', f.center());
    }
  }

  formName(): string {
    return this.form === 'sealed' ? 'Séptima Espada' : this.blindT > 0 ? 'Brujería — blinded' : 'Resurrección — Brujería';
  }

  /** the AI's opener: a polite introduction, a demand for a name */
  private preach(): void {
    if (this.preached) return;
    this.preached = true;
    this.g.hud?.showBanner('"I am Zommari Rureaux, Séptima Espada. And you are?"', 2.5);
  }

  ai(): KitAI {
    const sealed = () => this.form === 'sealed';
    const bruj = () => this.form === 'brujeria';
    const tgt = () => this.target(40);
    return {
      reach: 1.8,
      chain: 4,
      releaseAt: 0.6,
      ranged: () => this.form === 'brujeria',
      opener: () => this.preach(),
      moves: [
        { name: 'gemelos', use: () => this.skill1(), min: 2, max: 22, weight: 2.6, cd: 5, when: () => sealed() && this.copies.length < 2 },
        { name: 'tri', use: () => this.heavy(), min: 0, max: 9, weight: 1.8, cd: 4, when: sealed },
        { name: 'assault', use: () => this.skill3(), min: 0, max: 16, weight: 2.2, cd: 5, when: () => sealed() && this.copies.length >= 2 },
        { name: 'swap', use: () => this.skill2(), min: 0, max: 4, weight: 1.2, cd: 5, when: () => sealed() && this.copies.length > 0 && this.g.time - this.f.lastHurt.at < 1.5 },
        { name: 'legs', use: () => this.skill1(), min: 3, max: 38, weight: 3, cd: 4, when: () => bruj() && this.blindT <= 0 && !!tgt() && !this.holdOn(tgt()!, 'legs') },
        { name: 'march', use: () => this.heavy(), min: 4, max: 38, weight: 2.4, cd: 2.5, when: () => bruj() && this.blindT <= 0 && !!tgt() && !!this.holdOn(tgt()!, 'legs') },
        { name: 'arm', use: () => this.attack(), min: 0, max: 30, weight: 2.2, cd: 2, when: () => bruj() && this.blindT <= 0 && !!tgt() && !this.holdOn(tgt()!, 'arm') },
        { name: 'head', use: () => this.skill2(), min: 0, max: 26, weight: 2.4, cd: 6, when: () => bruj() && this.blindT <= 0 && !!tgt() && (!!this.holdOn(tgt()!, 'legs') || !!this.holdOn(tgt()!, 'arm')) },
        { name: 'objects', use: () => this.skill3(), min: 4, max: 30, weight: 3, cd: 4, when: () => bruj() && this.blindT <= 0 && this.g.projectiles.length > 0 },
        { name: 'forehead', use: () => this.release(), min: 3, max: 30, weight: 2, cd: 5, when: () => bruj() && (this.blindT > 0 || this.g.enemiesOf(this.f).length > 1) },
        { name: 'embrion', use: () => this.toggle(), min: 0, max: 60, weight: 5, cd: 14, when: () => bruj() && this.g.time - this.f.lastHurt.at < 0.8 && this.f.lastHurt.dmg > 60 },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    if (this.form === 'sealed')
      return [
        { key: 'LMB', name: 'Sword', kanji: '剣' },
        { key: 'RMB', name: 'Triangle', kanji: '三', cost: 14, cd: this.cd.tri, cdMax: 4 },
        { key: 'Q', name: 'Gemelos', kanji: '双児', cost: 18, cd: this.cd.gemelos, cdMax: 5 },
        { key: 'E', name: 'Swap', kanji: '替', cost: 6, cd: this.cd.swap, cdMax: 1.5 },
        { key: 'R', name: 'All Sides', kanji: '囲', cost: 10, cd: this.cd.assault, cdMax: 4 },
        { key: 'G', name: 'Meditate', kanji: '瞑', active: this.f.action instanceof PrayAction, cd: this.cd.pray, cdMax: 4 },
        { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
        { key: 'F', name: 'Brujería', kanji: '呪眼', cost: 40, tint: '#c77dff' },
      ];
    const blind = this.blindT > 0;
    return [
      { key: 'LMB', name: 'Amor: Arm', kanji: '腕', cost: 6, cd: this.cd.palm, cdMax: 1.2, active: blind ? false : undefined },
      { key: 'RMB', name: 'March', kanji: '歩', cost: 8, cd: this.cd.march, cdMax: 2 },
      { key: 'Q', name: 'Amor: Legs', kanji: '脚', cost: 14, cd: this.cd.legs, cdMax: 3 },
      { key: 'E', name: 'Amor: Head', kanji: '頭', cost: 30, cd: this.cd.head, cdMax: 10 },
      { key: 'R', name: 'Amor: Objects', kanji: '物', cost: 12, cd: this.cd.objects, cdMax: 5 },
      { key: 'F', name: 'Forehead Eyes', kanji: '額眼', cost: 20, cd: this.cd.forehead, cdMax: 6 },
      { key: 'G', name: 'El Embrion', kanji: '守胚', cost: 25, active: this.f.action instanceof EmbrionAction, cd: this.cd.embrion, cdMax: 14, timer: blind ? this.blindT / 12 : undefined, tint: '#ff9ad0' },
      { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare },
    ];
  }
}
