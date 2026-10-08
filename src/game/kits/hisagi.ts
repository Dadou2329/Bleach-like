// Shūhei Hisagi's kit (docs/kits/hisagi.md). Fear, in his own hands.
// Sealed (he would rather not release): a diagonal cut, the left elbow, the rising cut that launches, a heel drop
// (LMB); the lunging draw-cut (RMB); Bakudō #62 Hyapporankan — the rod that splits into a rain of rods and pins
// the target (Q); an explosive band torn off and thrown — a flash and smoke that blinds (E, three: the choker and
// both armbands, each gone from him once used); Hadō #11 Tsuzuri Raiden — the blade charged, every cut paralyses
// (R); "Kare, Kazeshini" (F); Bakudō #63 Sajō Sabaku — the rope round the upper body, no attacks (G).
// Shikai Kazeshini: a sickle in each fist, one chain between them. LMB throws the right, then the left, swings the
// chain wide, and yanks the far sickle round from behind the target; RMB the fan spin (both whirling round him,
// swatting shots); Q the steered throw (out wide, round, in from behind — it was not where they were looking); E
// Kubikake (the chain round the neck, hauled in and slammed down); R the chain bind with Tsuzuri Raiden sent down
// the chain; G chain-life (the novel's rule: wounds re-linked, paid in reiatsu); F the Bankai.
// Bankai Fushi no Kōjō (novel): the orb of chains over him, the noose on his own neck. LMB the Shikai string; RMB
// chains rained from the orb; Q the noose on the target — the life-link: neither of them loses HP, every wound is
// paid from both their reiatsu; E the orb's tethers drag them in; R Hangman's Verdict — with the shared pool nearly
// dry he cuts his own noose and brings the blow down; G a band; F unlinks and seals back to the Shikai. Near the
// orb, reishi stagnates: enemies' reiatsu does not come back.
// Passive: Fear — blows taken while he acts build it, and it sharpens Kazeshini (up to +30 %).
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { DamageOpts, Game, Projectile } from '../game';
import { KAZESHINI_BASE_Z, KAZESHINI_TIP_Z, SICKLE_BUTT_Z, hisagiAsset, hisagiProp } from '../../chars/hisagi';
import { HISAGI_CHAIN, HISAGI_CLIPS, HISAGI_STANCE, KAZESHINI_CHAIN, KAZESHINI_CLIPS, KAZESHINI_STANCE } from '../../chars/hisagiClips';
import type { AuraStyle } from '../../vfx/aura';
import { BandBomb, CHAIN_GREY, ChainWrap, FushiOrb, HISAGI_GREEN, Hyapporankan, SajoRope, raidenArc, raidenBlade, raidenJolt } from '../../vfx/kazeshini';
import { ChainLine, TetherBlade, type TetherHit, type TetherStyle } from '../../vfx/shiro';
import { groundAt } from '../../vfx/iceArts';
import { CapsuleShape } from '../../destruction/shapes';
import { TEX_GLOW } from '../../vfx/sprites';
import type { AbilityInfo } from '../../ui/hud';
import type { Kit, KitAI } from './kit';
import { aimPoint } from './vasto';

type BladeDef = NonNullable<FighterDef['blade']>;
type Form = 'sealed' | 'shikai' | 'bankai';
type Hand = 'R' | 'L';

const AURA: AuraStyle = { core: HISAGI_GREEN.core, body: HISAGI_GREEN.body, rim: HISAGI_GREEN.rim };
const TRAIL = { color: '#9FE3B0', core: '#F2FFF4' };
const KATANA: BladeDef = { prop: 'sword', base: [0, 0, KAZESHINI_BASE_Z], tip: [0, 0, KAZESHINI_TIP_Z], ...TRAIL };
/** the right sickle in the hand (for the trail only: the sickles strike on their chains) */
const SICKLE: BladeDef = { prop: 'sword', base: [0, 0, 8 / 48], tip: [0, 0, 22 / 48], ...TRAIL };
const SICKLE_STYLE: TetherStyle = { kind: 'chain', color: CHAIN_GREY, length: 22 / 48, butt: SICKLE_BUTT_Z, cutR: 0.3, glow: HISAGI_GREEN.body, thick: 0.022 };
const SPEED: FighterDef['speed'] = { run: 10.8, sprint: 23, jump: 12, dash: 15, dashTime: 0.12 };
const BANDS = ['choker', 'armband.L', 'armband.R'];
const RAIDEN_T = 6;
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

/** both forms' clips: the release and the band run on through the swap */
const CLIPS = [...HISAGI_CLIPS, ...KAZESHINI_CLIPS.filter((c) => !HISAGI_CLIPS.some((h) => h.name === c.name))];

const sealedProps = () => [
  { key: 'sword', model: hisagiProp('katana'), socket: 'grip.R' },
  { key: 'saya', model: hisagiProp('saya'), socket: 'hip.L' },
  { key: 'tattoo', model: hisagiProp('tattoo'), socket: 'cheek.L' },
];

export const HISAGI_DEF: FighterDef = {
  id: 'hisagi',
  name: 'Shūhei Hisagi',
  title: 'Lieutenant, 9th Division',
  build: () => ({ asset: hisagiAsset(), props: sealedProps() }),
  stance: HISAGI_STANCE,
  clips: CLIPS,
  aura: AURA,
  blade: KATANA,
  hp: 1000,
  rei: 160,
  speed: { ...SPEED },
  radius: 0.4,
  height: 1.81,
};

// ------------------------------------------------------------------ helpers

function lungeTo(f: Fighter, stop: number, at: number, max = 28): number {
  const tgt = f.faceTarget;
  if (!tgt) return 0;
  const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
  if (d <= stop + 0.25 || d > 9) return 0;
  const per = (1 - Math.exp(-f.pushDrag * Math.max(0.06, at - 0.05))) / f.pushDrag;
  f.push.addScaledVector(f.forward(_v), Math.min(max, (d - stop) / per));
  return stop;
}

function lungeStop(f: Fighter, stop: number): number {
  const tgt = f.faceTarget;
  if (stop > 0 && tgt && Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z) <= stop) {
    f.push.x = 0;
    f.push.z = 0;
    return 0;
  }
  return stop;
}

interface Blow {
  damage: number;
  knock: number;
  launch?: number;
  heavy?: boolean;
  reach: number;
  y: number;
  r: number;
  /** a downward blow (the heel drop): slams an airborne target down */
  down?: boolean;
}

interface Move {
  windows?: { at: [number, number]; spec: BladeSpec }[];
  blow?: Blow;
  hop?: number;
}

const spec = (damage: number, knock: number, cut: number, extra: Partial<BladeSpec> = {}): BladeSpec => ({ damage, knock, launch: 0, hitstop: 0.05, shake: 0.14, cut, ...extra });

const MOVES: Record<string, Move> = {
  hs_s1: { windows: [{ at: [0.1, 0.26], spec: spec(20, 8, 380, { reach: 0.1 }) }] },
  hs_s2: { blow: { damage: 16, knock: 11, launch: 1, reach: 0.85, y: 1.35, r: 0.8 } },
  hs_s3: { windows: [{ at: [0.1, 0.26], spec: spec(20, 3, 380, { launch: 9, reach: 0.1 }) }] },
  hs_s4: { blow: { damage: 26, knock: 6, heavy: true, reach: 0.95, y: 1.45, r: 0.95, down: true }, hop: 4.2 },
  hs_draw: { windows: [{ at: [0.18, 0.42], spec: spec(36, 16, 640, { launch: 2, heavy: true, hitstop: 0.09, shake: 0.32, reach: 0.25 }) }] },
};

/** Marker for the skills a string can cancel into. */
abstract class SkillAction extends FighterAction {}

// ------------------------------------------------------------------ sealed

/** One move of the sealed string (or the draw-cut). */
class MoveAction extends FighterAction {
  readonly name: string;
  private info: Move;
  private dur = 0;
  private comboAt = 0;
  private stopAt = 0;
  private win = -1;
  queued = false;
  constructor(readonly kit: HisagiKit, readonly clip: string, readonly index: number) {
    super();
    this.name = clip;
    this.info = MOVES[clip];
    this.mobility = 0.12;
    this.airGravity = this.info.hop ? 1 : 0.12;
    if (clip === 'hs_draw') this.armor = 0.25;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    f.bladeHits.clear();
    const w0 = this.info.windows?.[0];
    const at = w0 ? w0.at[0] : c.events.hit ?? 0.2;
    this.stopAt = lungeTo(f, this.info.blow ? 0.95 : this.clip === 'hs_draw' ? 1.6 : 1.3, at);
    if (this.info.hop && f.grounded) {
      f.body.vel.y = this.info.hop;
      f.body.grounded = false;
    }
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n === 'hit' && this.info.blow) this.kit.blow(this.info.blow);
        if (n === 'step') g.sfx.play('step', f.pos, 0.5);
      },
    });
    if (this.info.blow) g.sfx.play('swing', f.center(), 0.6);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    this.stopAt = lungeStop(f, this.stopAt);
    const ws = this.info.windows;
    if (ws) {
      let pre = -1, cur = -1;
      for (let i = 0; i < ws.length; i++) {
        if (t >= ws[i].at[0] - 0.04 && t <= ws[i].at[1]) pre = i;
        if (t >= ws[i].at[0] && t <= ws[i].at[1]) cur = i;
      }
      if (pre >= 0 && pre !== this.win) {
        this.win = pre;
        f.bladeHits.clear();
        f.bladeSpec = this.kit.bladeSpec(ws[pre].spec);
        g.sfx.play(ws[pre].spec.heavy ? 'swingHeavy' : 'swing', f.center());
      }
      f.bladeActive = cur >= 0;
      if (f.trail) f.trail.emitting = pre >= 0;
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
    const ws = this.info.windows;
    const w = ws ? ws[ws.length - 1].at[1] : 0.3;
    if (next.name === 'dash') return this.t >= w;
    return next instanceof SkillAction && this.t >= w + 0.04;
  }
}

/** A skill: plays its clip, runs its events, ends with the clip (or at `endAt`). */
class Skill extends SkillAction {
  private fired = new Set<string>();
  constructor(readonly kit: HisagiKit, readonly name: string, readonly clip: string, readonly endAt: number, readonly events: Record<string, [number, () => void]>, opts: { armor?: number; mobility?: number; cancelAt?: number } = {}) {
    super();
    this.mobility = opts.mobility ?? 0.2;
    this.armor = opts.armor ?? 0;
    this.cancelAt = opts.cancelAt ?? endAt * 0.8;
  }
  private cancelAt: number;
  override start(f: Fighter): void {
    f.anim.play(this.clip, { onEvent: (n) => this.fire(n) });
  }
  private fire(n: string): void {
    const e = this.events[n];
    if (!e || this.fired.has(n)) return;
    this.fired.add(n);
    e[1]();
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    // the events fire by time as well, in case the clip is cut short
    for (const [n, [at]] of Object.entries(this.events)) if (this.t >= at + 0.03) this.fire(n);
    if (this.t >= this.endAt) this.done = true;
  }
  override end(): void {
    for (const n of Object.keys(this.events)) this.fire(n);
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t >= this.cancelAt;
  }
}

// ------------------------------------------------------------------ Shikai

/** One move of the Shikai string: a sickle thrown, the chain swung, the yank. */
class ChainMove extends FighterAction {
  readonly name: string;
  private dur = 0;
  private comboAt = 0;
  private fired = new Set<string>();
  queued = false;
  constructor(readonly kit: HisagiKit, readonly clip: string, readonly index: number) {
    super();
    this.name = clip;
    this.mobility = 0.3;
  }
  override start(f: Fighter): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    f.anim.play(this.clip, { onEvent: (n) => this.fire(n) });
  }
  private fire(n: string): void {
    if (this.fired.has(n)) return;
    this.fired.add(n);
    this.kit.chainEvent(this.clip, n);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const c = f.anim.clip(this.clip);
    if (c) for (const [n, at] of Object.entries(c.events)) if (n !== 'combo' && this.t >= at + 0.03) this.fire(n);
    if (this.queued && this.t >= this.comboAt) {
      this.done = true;
      this.kit.chain(this.index + 1);
      return;
    }
    if (this.t >= this.dur) this.done = true;
  }
  override canCancel(next: FighterAction): boolean {
    if (next.name === 'dash') return this.t >= 0.2;
    return next instanceof SkillAction && this.t >= 0.18;
  }
}

/** RMB (Shikai): the fan spin — both sickles whirling round him at the chain's length. */
class FanAction extends SkillAction {
  readonly name = 'fan';
  private tick = 0;
  constructor(readonly kit: HisagiKit) {
    super();
    this.mobility = 0.45;
    this.armor = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('hs_fan', { hold: true });
    this.kit.fan(1.3);
    g.sfx.play('swingHeavy', f.center(), 0.8);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.tick -= dt;
    if (this.tick <= 0) {
      this.tick = 0.06;
      // the blades swat shots out of the air
      g.rejectNear(f.center(), 3.6, f, false);
    }
    if (this.t >= 1.3) this.done = true;
  }
  override end(f: Fighter): void {
    f.anim.stopAll(0.2);
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > 0.6;
  }
}

/** the chain slack between his fists (it lives as long as he does) */
class HeldChain implements Projectile {
  done = false;
  private line: ChainLine;
  private a = new THREE.Vector3();
  private b = new THREE.Vector3();
  constructor(g: Game, readonly owner: Fighter, private ends: (a: THREE.Vector3, b: THREE.Vector3) => void) {
    this.line = new ChainLine(g, CHAIN_GREY, 0.02);
  }
  update(_dt: number, g: Game): void {
    if (this.owner.dead || !g.fighters.includes(this.owner)) {
      this.done = true;
      return;
    }
    this.ends(this.a, this.b);
    this.line.update(this.a, this.b, 0.35);
  }
  dispose(): void {
    this.line.dispose();
  }
}

// ------------------------------------------------------------------ the kit

interface Link {
  o: Fighter;
  prevParry: Fighter['parry'];
}

export class HisagiKit implements Kit {
  form: Form = 'sealed';
  comboIndex = 0;
  private lastSwingEnd = 0;
  flare = false;
  /** explosive bands left (choker, left arm, right arm) */
  bandsLeft = 3;
  /** Tsuzuri Raiden on the blade (s left) */
  raidenT = 0;
  /** chain-life (novel): wounds re-linked, paid in reiatsu */
  lifeOn = false;
  /** Fear (0..1): blows taken while acting; it sharpens Kazeshini */
  fear = 0;
  /** the sickles out on their chains */
  readonly out: Record<Hand, TetherBlade | null> = { R: null, L: null };
  private heldChain: HeldChain | null = null;
  private wrap: ChainWrap | null = null;
  orb: FushiOrb | null = null;
  link: Link | null = null;
  private redirects: { t: number; hand: Hand; to: () => THREE.Vector3 | null }[] = [];
  private reiSeen = new Map<number, number>();
  private hudT = 0;
  private raidenFx = 0;
  readonly cd = { draw: 0, rod: 0, band: 0, raiden: 0, sajo: 0, fan: 0, steer: 0, kubi: 0, bind: 0, life: 0, rain: 0, noose: 0, tether: 0, verdict: 0 };

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.parry = (amount, from, o) => this.parry(amount, from, o);
    f.onHurt = (dmg) => {
      // Fear: knowing the blade's weight
      if (f.action && this.form !== 'sealed') this.fear = Math.min(1, this.fear + dmg / 380);
      this.applyStats();
    };
    // raw power overwhelms him
    f.knockTaken = 1.15;
    this.hands();
    this.applyLook();
    this.applyStats();
  }

  private hands(): void {
    const rig = this.f.visual.rig;
    const two = this.form !== 'sealed';
    rig.setBoneVisible('fist.R', true);
    rig.setBoneVisible('palm.R', false);
    rig.setBoneVisible('fist.L', two);
    rig.setBoneVisible('palm.L', !two);
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    if (this.fear > 0) {
      this.fear = Math.max(0, this.fear - dt * 0.015);
      if (Math.random() < dt * 2) this.applyStats();
    }
    // Tsuzuri Raiden crackles along the blade
    if (this.raidenT > 0) {
      this.raidenT -= dt;
      this.raidenFx -= dt;
      if (this.raidenFx <= 0 && this.form === 'sealed') {
        this.raidenFx = 0.06;
        raidenBlade(g, f.blade.base.clone(), f.blade.tip.clone());
      }
    }
    // chain-life drains while it holds
    if (this.lifeOn) {
      f.rei -= dt * 2;
      if (f.rei <= 0) this.setLife(false);
    }
    // the sickles back in the hand
    for (const h of ['R', 'L'] as Hand[]) {
      const t = this.out[h];
      if (t && t.done) {
        this.out[h] = null;
        this.showSickle(h, true);
      }
    }
    for (let i = this.redirects.length - 1; i >= 0; i--) {
      const r = this.redirects[i];
      r.t -= dt;
      if (r.t > 0) continue;
      this.redirects.splice(i, 1);
      const t = this.out[r.hand];
      const to = r.to();
      if (t && to) t.redirect(to, 4);
    }
    if (this.wrap?.done) this.wrap = null;
    if (this.form === 'bankai') this.updateBankai();
    this.hudT -= dt;
    if (this.hudT <= 0 && g.hud && f === g.player) {
      this.hudT = 0.25;
      g.hud.form = this.formName();
    }
  }

  // ---------------------------------------------------------------- inputs

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof MoveAction || cur instanceof ChainMove) {
      if (cur.index >= 0) cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastSwingEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.form === 'sealed' ? HISAGI_CHAIN : KAZESHINI_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastSwingEnd = this.g.time + 0.8;
    this.f.act(this.form === 'sealed' ? new MoveAction(this, list[idx], idx) : new ChainMove(this, list[idx], idx), true);
  }

  /** RMB: the draw-cut / the fan spin / chains rained from the orb */
  heavy(): void {
    if (this.form === 'sealed') this.special(new MoveAction(this, 'hs_draw', -1), 6, 'draw', 2.4);
    else if (this.form === 'shikai') {
      if (this.out.R || this.out.L) return;
      this.special(new FanAction(this), 14, 'fan', 4.5);
    } else {
      this.special(new Skill(this, 'rain', 'hs_noose', 0.62, { noose: [0.28, () => this.rain()] }), 16, 'rain', 4);
    }
  }

  /** Q: Hyapporankan / the steered throw / the noose */
  skill1(): void {
    if (this.form === 'sealed') {
      this.special(new Skill(this, 'rod', 'hs_rod', 0.56, { throw: [0.28, () => this.hyapporankan()] }), 14, 'rod', 8);
    } else if (this.form === 'shikai') {
      if (this.out.R) return;
      this.special(new Skill(this, 'steer', 'hs_steer', 0.86, {
        throw: [0.16, () => this.steeredThrow()],
        yank: [0.62, () => this.out.R?.reel()],
      }), 12, 'steer', 4);
    } else {
      if (this.link) {
        if (this.f === this.g.player) this.g.hud?.showBanner('Already linked', 1);
        return;
      }
      this.special(new Skill(this, 'noose', 'hs_noose', 0.62, { noose: [0.28, () => this.castNoose()] }), 20, 'noose', 6);
    }
  }

  /** E: the explosive band / Kubikake / the orb's tethers */
  skill2(): void {
    if (this.form === 'sealed') this.band();
    else if (this.form === 'shikai') {
      if (this.out.R) return;
      this.special(new Skill(this, 'kubi', 'hs_kubi', 1.0, {
        throw: [0.14, () => this.kubiThrow()],
        slam: [0.72, () => this.kubiSlam()],
      }, { armor: 0.3 }), 14, 'kubi', 5);
    } else {
      this.special(new Skill(this, 'tether', 'hs_k4', 0.5, { yank: [0.18, () => this.tethers()] }), 14, 'tether', 5);
    }
  }

  /** R: Tsuzuri Raiden / the chain bind / Hangman's Verdict */
  skill3(): void {
    if (this.form === 'sealed') {
      this.special(new Skill(this, 'raiden', 'hs_raiden', 0.66, { charge: [0.36, () => this.charge()] }), 10, 'raiden', 9);
    } else if (this.form === 'shikai') {
      if (this.out.L) return;
      this.special(new Skill(this, 'bind', 'hs_bind', 0.9, {
        throw: [0.14, () => this.bindThrow()],
        raiden: [0.52, () => this.bindRaiden()],
      }), 16, 'bind', 7);
    } else {
      if (!this.link || this.pool() > 0.25) {
        if (this.f === this.g.player) this.g.hud?.showBanner(this.link ? 'The pool is not dry enough' : 'No one on the noose', 1.2);
        return;
      }
      this.special(new Skill(this, 'verdict', 'hs_verdict', 0.95, {
        cut: [0.26, () => this.cutOwnNoose()],
        strike: [0.6, () => this.verdictStrike()],
      }, { armor: 0.6 }), 0, 'verdict', 3);
    }
  }

  /** F: "Kare, Kazeshini" / "Bankai — Fushi no Kōjō" / unlink and seal back to the Shikai */
  release(): void {
    const { f, g } = this;
    if (f.busy || f.sealT > 0) return;
    if (this.form === 'sealed') {
      if (!f.spendRei(20)) return this.noRei();
      f.act(new Skill(this, 'kare', 'hs_kare', 0.92, {
        name: [0.2, () => g.callout('刈れ「風死」', 'KARE, KAZESHINI', HISAGI_GREEN.body)],
        split: [0.42, () => this.toShikai()],
      }, { armor: 0.6, mobility: 0.1 }), true);
      return;
    }
    if (this.form === 'shikai') {
      if (!f.spendRei(40)) return this.noRei();
      f.act(new Skill(this, 'bankai', 'hs_bankai', 1.1, {
        name: [0.2, () => g.callout('卍解「風死絞縄」', 'BANKAI — FUSHI NO KŌJŌ', HISAGI_GREEN.body)],
        orb: [0.55, () => this.toBankai()],
      }, { armor: 0.8, mobility: 0.1 }), true);
      return;
    }
    this.toShikai();
  }

  /** G: Sajō Sabaku / chain-life / a band */
  toggle(): void {
    if (this.form === 'sealed') {
      this.special(new Skill(this, 'sajo', 'hs_sajo', 0.6, { bind: [0.32, () => this.sajo()] }), 12, 'sajo', 9);
    } else if (this.form === 'shikai') {
      if (this.lifeOn) {
        this.setLife(false);
        return;
      }
      this.special(new Skill(this, 'life', 'hs_life', 0.6, { life: [0.3, () => this.setLife(true)] }), 6, 'life', 2);
    } else this.band();
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

  private noRei(): void {
    if (this.f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
  }

  target(range: number): Fighter | null {
    return this.g.nearestEnemy(this.f, range, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, range);
  }

  private special(a: FighterAction, cost: number, cdKey: keyof typeof this.cd, cd: number): boolean {
    const f = this.f;
    if (this.cd[cdKey] > 0 || f.dead) return false;
    if (f.action && !f.action.canCancel(a)) return false;
    if (f.hitstun > 0 || f.dashT > 0) return false;
    if (!f.spendRei(cost)) {
      this.noRei();
      return false;
    }
    this.cd[cdKey] = cd;
    f.act(a, true);
    return true;
  }

  // ---------------------------------------------------------------- the sealed blade

  /** the blade's spec with Tsuzuri Raiden on it */
  bladeSpec(s: BladeSpec): BladeSpec {
    if (this.raidenT <= 0) return s;
    return { ...s, onHit: (o) => this.paralyse(o, 0.9) };
  }

  /** a kick or an elbow in front of him */
  blow(s: Blow): void {
    const { f, g } = this;
    const fw = f.forward();
    const p = f.pos.clone().addScaledVector(fw, s.reach).setY(f.pos.y + s.y);
    let hit = false;
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      const cy = Math.max(o.pos.y + 0.1, Math.min(o.pos.y + o.def.height - 0.2, p.y));
      if (Math.hypot(o.pos.x - p.x, cy - p.y, o.pos.z - p.z) > s.r + o.def.radius) continue;
      hit = true;
      g.damage(o, s.damage, f, fw.clone(), { knock: s.knock, launch: s.launch, heavy: s.heavy, hitstop: s.heavy ? 0.1 : 0.06, shake: s.heavy ? 0.3 : 0.15 });
      if (s.down && !o.grounded && !o.def.boss) o.body.vel.y = -16;
      g.sparks(new THREE.Vector3(o.pos.x, cy, o.pos.z), fw, HISAGI_GREEN.body, s.heavy ? 12 : 6);
    }
    g.sfx.play(hit ? 'impact' : 'swing', p, hit ? 0.9 : 0.4);
  }

  /** paralysis: the current locks them up */
  paralyse(o: Fighter, s: number): void {
    if (o.dead) return;
    if (!o.def.boss) {
      o.stopAction();
      o.hitstun = Math.max(o.hitstun, s);
    }
    raidenJolt(this.g, o);
  }

  private charge(): void {
    this.raidenT = RAIDEN_T;
    this.g.callout('破道の十一「綴雷電」', 'HADŌ #11 — TSUZURI RAIDEN', '#CFE8FF');
    this.g.sfx.play('ting', this.f.center(), 0.7);
    for (let i = 0; i < 4; i++) raidenArc(this.g, this.f.blade.base.clone(), this.f.blade.tip.clone(), 0.1);
  }

  private hyapporankan(): void {
    const { f, g } = this;
    this.g.callout('縛道の六十二「百歩欄干」', 'BAKUDŌ #62 — HYAPPORANKAN', '#D6ECFF');
    const t = this.target(30);
    const from = this.socketPoint('palm.L', new THREE.Vector3());
    const at = t ? t.center() : aimPoint(f, g);
    const pinned = new Map<number, boolean>();
    g.addProjectile(new Hyapporankan(g, f, from, t, at, t?.def.boss ? 1 : 2.5, (o) => {
      pinned.set(o.id, o.rooted);
      o.rooted = true;
      o.disarmT = Math.max(o.disarmT, 2.5);
      if (!o.def.boss) {
        o.stopAction();
        o.hitstun = Math.max(o.hitstun, 0.5);
      }
      g.damage(o, 12, f, _v.set(0, -1, 0).clone(), { knock: 0, quiet: true });
    }, (o) => {
      o.rooted = pinned.get(o.id) ?? false;
    }));
  }

  /** a band torn off and flung: E sealed, G in the Bankai */
  private band(): void {
    if (this.bandsLeft <= 0) {
      if (this.f === this.g.player) this.g.hud?.showBanner('No bands left', 1.2);
      return;
    }
    this.special(new Skill(this, 'band', 'hs_band', 0.56, {
      tear: [0.18, () => this.tearBand()],
      throw: [0.34, () => this.throwBand()],
    }), 6, 'band', 3);
  }

  private tearBand(): void {
    const i = 3 - this.bandsLeft;
    if (i < 0 || i >= BANDS.length) return;
    this.f.visual.rig.setBoneVisible(BANDS[i], false);
    this.bandsLeft--;
  }

  private throwBand(): void {
    const { f, g } = this;
    const from = this.socketPoint('palm.L', new THREE.Vector3());
    const t = this.target(20);
    const at = t ? t.center() : aimPoint(f, g);
    const d = _v.subVectors(at, from);
    const flat = Math.hypot(d.x, d.z);
    const time = Math.max(0.25, Math.min(0.7, flat / 16));
    const vel = new THREE.Vector3(d.x / time, (d.y + 0.5 * 20 * time * time) / time, d.z / time);
    g.addProjectile(new BandBomb(g, f, from, vel, (p) => {
      for (const o of g.enemiesOf(f)) {
        if (o.dead) continue;
        const dd = o.center(_w).distanceTo(p);
        if (dd > 3.8 + o.def.radius) continue;
        g.damage(o, 24 * (1 - dd / 5), f, _w.subVectors(o.pos, p).setY(0).normalize().clone(), { knock: 10, launch: 3, heavy: true, energy: true });
        o.blindT = Math.max(o.blindT, 2.6);
      }
    }));
  }

  private sajo(): void {
    const { f, g } = this;
    const t = this.target(16);
    g.callout('縛道の六十三「鎖条鎖縛」', 'BAKUDŌ #63 — SAJŌ SABAKU', '#F2D04A');
    if (!t) return;
    const dur = t.def.boss ? 1 : 2.6;
    t.disarmT = Math.max(t.disarmT, dur);
    t.slow(0.6, dur);
    if (!t.def.boss) {
      t.stopAction();
      t.hitstun = Math.max(t.hitstun, 0.35);
    }
    g.addProjectile(new SajoRope(g, f, t, dur, () => {}));
  }

  // ---------------------------------------------------------------- Kazeshini

  /** a fist's grip point (where the sickle is held) */
  gripPoint(hand: Hand, out: THREE.Vector3): THREE.Vector3 {
    return this.socketPoint(hand === 'R' ? 'grip.R' : 'grip.L', out);
  }

  /** the butt of the sickle held in that fist (where the chain ties on), or the fist when it is thrown */
  butt(hand: Hand, out: THREE.Vector3): THREE.Vector3 {
    const p = this.f.visual.props.get(hand === 'R' ? 'sword' : 'sickleL');
    if (!p || !p.visible) return this.gripPoint(hand, out);
    p.updateWorldMatrix(true, false);
    return out.set(0, 0, SICKLE_BUTT_Z).applyMatrix4(p.matrixWorld);
  }

  private showSickle(hand: Hand, on: boolean): void {
    const p = this.f.visual.props.get(hand === 'R' ? 'sword' : 'sickleL');
    if (p) p.visible = on;
  }

  /** a sickle off its fist on the chain */
  private loose(hand: Hand): TetherBlade | null {
    if (this.out[hand] || this.form === 'sealed') return null;
    const { f, g } = this;
    const t = new TetherBlade(g, f, hisagiProp('sickle'), () => this.gripPoint(hand, new THREE.Vector3()), SICKLE_STYLE);
    g.addProjectile(t);
    this.out[hand] = t;
    this.showSickle(hand, false);
    return t;
  }

  private dmgK(): number {
    return 1 + 0.3 * this.fear;
  }

  private hit(damage: number, knock: number, cut: number, extra: Partial<TetherHit> = {}): TetherHit {
    // on the noose nothing gets round the link, not even his own blades
    return { damage: damage * this.dmgK(), knock, cut, ...extra, ...(this.link ? { unblockable: false } : {}) };
  }

  /** where to send a throw: the target, or along the aim */
  private throwPoint(out: THREE.Vector3): THREE.Vector3 {
    const t = this.target(20);
    return t ? t.center(out) : aimPoint(this.f, this.g, out);
  }

  /** the string's events */
  chainEvent(clip: string, ev: string): void {
    const { f, g } = this;
    if (clip === 'hs_k1' || clip === 'hs_k2') {
      const hand: Hand = clip === 'hs_k1' ? 'R' : 'L';
      if (ev === 'throw') this.loose(hand)?.throwAt(this.throwPoint(new THREE.Vector3()), { speed: 28, range: 10, spin: true, hit: this.hit(20, 6, 360) });
      if (ev === 'haul') this.out[hand]?.reel();
      return;
    }
    if (clip === 'hs_k3' && ev === 'swing') {
      const t = this.loose('R');
      if (!t) return;
      const left = new THREE.Vector3(Math.cos(f.yaw), 0, -Math.sin(f.yaw));
      t.orbit({ center: this.swingCentre(), u: left.clone().negate(), v: f.forward(), radius: 3.6, a0: -0.3, a1: Math.PI + 0.3, dur: 0.3, hit: this.hit(18, 10, 400) });
      g.sfx.play('swingHeavy', f.center(), 0.7);
      return;
    }
    if (clip === 'hs_k4' && ev === 'yank') {
      // the far sickle goes out past them and comes back in from behind
      const tgt = this.target(16);
      const t = this.loose('L');
      if (!t) return;
      const c = tgt ? tgt.center() : this.throwPoint(new THREE.Vector3());
      const away = _v.subVectors(c, f.pos).setY(0).normalize();
      const side = _w.set(away.z, 0, -away.x);
      const past = c.clone().addScaledVector(away, 2.6).addScaledVector(side, 2.2);
      t.throwAt(past, { speed: 32, range: 18, spin: true, hit: this.hit(24, 12, 380, { launch: 2, unblockable: true }) });
      this.redirects.push({ t: 0.24, hand: 'L', to: () => (tgt && !tgt.dead ? tgt.center() : null) });
    }
  }

  /** the centre of a level swing round him: at the height of whoever it is meant for (slopes) */
  private swingCentre(): () => THREE.Vector3 {
    const f = this.f;
    const tgt = this.target(9);
    return () => {
      const c = f.center(new THREE.Vector3());
      c.y = tgt && !tgt.dead ? Math.max(f.pos.y + 0.3, Math.min(f.pos.y + 2.4, tgt.center(_w).y)) : f.pos.y + 1.2;
      return c;
    };
  }

  /** RMB: both sickles round him at the chain's length */
  fan(dur: number): void {
    const f = this.f;
    const turns = Math.PI * 2 * 2.6;
    const left = new THREE.Vector3(Math.cos(f.yaw), 0, -Math.sin(f.yaw));
    const centre = this.swingCentre();
    // one sickle pays its chain out while the other winds in: between them the whole disc is swept
    this.loose('R')?.orbit({ center: centre, u: left.clone().negate(), v: f.forward(), radius: 1.3, radius1: 3.4, a0: 0, a1: turns, dur, hit: this.hit(14, 9, 420) });
    this.loose('L')?.orbit({ center: centre, u: left.clone(), v: f.forward().negate(), radius: 3.4, radius1: 1.3, a0: 0, a1: turns, dur, hit: this.hit(14, 9, 420) });
  }

  /** Q: out wide to the side, round behind them, and in from behind */
  private steeredThrow(): void {
    const { f } = this;
    const tgt = this.target(18);
    const t = this.loose('R');
    if (!t) return;
    const c = tgt ? tgt.center() : this.throwPoint(new THREE.Vector3());
    const away = _v.subVectors(c, f.pos).setY(0).normalize().clone();
    const side = new THREE.Vector3(away.z, 0, -away.x);
    t.throwAt(c.clone().addScaledVector(side, -4).addScaledVector(away, -1), { speed: 26, range: 22, spin: true, hit: this.hit(30, 14, 420, { launch: 3, heavy: true, unblockable: true }) });
    this.redirects.push({ t: 0.2, hand: 'R', to: () => (tgt && !tgt.dead ? tgt.center().addScaledVector(away, 2.4).addScaledVector(side, -1) : null) });
    this.redirects.push({ t: 0.36, hand: 'R', to: () => (tgt && !tgt.dead ? tgt.center() : null) });
  }

  private kubiVictim: Fighter | null = null;

  /** E: the chain at the neck — the sickle hooks them and they are hauled in */
  private kubiThrow(): void {
    const t = this.loose('R');
    if (!t) return;
    this.kubiVictim = null;
    const tgt = this.target(12);
    const at = tgt ? tgt.center().setY(tgt.pos.y + tgt.def.height * 0.85) : this.throwPoint(new THREE.Vector3());
    t.onHit = (o, impaled) => {
      this.kubiVictim = o;
      this.g.callout('首挂', 'KUBIKAKE', HISAGI_GREEN.body);
      // the chain is round the neck: hauled in at once
      if (impaled) t.reel();
    };
    t.throwAt(at, { speed: 32, range: 12, spin: false, impale: true, hit: this.hit(12, 0, 0) });
  }

  /** ... then slammed down into the ground */
  private kubiSlam(): void {
    const { f, g } = this;
    const o = this.kubiVictim;
    this.kubiVictim = null;
    if (!o || o.dead || o.pos.distanceTo(f.pos) > 7) return;
    const gy = groundAt(g, o.pos.x, o.pos.y + 1, o.pos.z, 8) ?? o.pos.y;
    if (!o.def.boss) {
      o.body.vel.y = -18;
      o.stopAction();
      o.hitstun = Math.max(o.hitstun, 0.9);
    }
    g.damage(o, 40 * this.dmgK(), f, _v.subVectors(o.pos, f.pos).setY(0).normalize().clone(), { knock: 3, heavy: true, hitstop: 0.14, shake: 0.6 });
    g.groundImpact(new THREE.Vector3(o.pos.x, gy, o.pos.z), 1.5, 260, HISAGI_GREEN.body, f);
    this.out.R?.reel();
  }

  /** R: the left sickle thrown to wrap them in the chain */
  private bindThrow(): void {
    const t = this.loose('L');
    if (!t) return;
    t.onHit = (o) => {
      if (this.wrap || o.dead) return;
      this.startWrap(o);
      t.reel();
    };
    t.throwAt(this.throwPoint(new THREE.Vector3()), { speed: 32, range: 11, spin: true, hit: this.hit(10, 0, 0) });
  }

  private startWrap(o: Fighter): void {
    const { f, g } = this;
    const dur = o.def.boss ? 1.2 : 2.8;
    const wasRooted = o.rooted;
    o.rooted = true;
    o.disarmT = Math.max(o.disarmT, dur);
    if (!o.def.boss) o.stopAction();
    this.wrap = new ChainWrap(g, f, o, dur, () => this.gripPoint('L', new THREE.Vector3()), () => {
      o.rooted = wasRooted;
    });
    g.addProjectile(this.wrap);
    g.sfx.play('impact', o.center(), 0.6);
  }

  /** ... and Tsuzuri Raiden sent down the chain */
  private bindRaiden(): void {
    const { f, g } = this;
    const w = this.wrap;
    g.callout('破道の十一「綴雷電」', 'HADŌ #11 — TSUZURI RAIDEN', '#CFE8FF');
    if (!w || w.done) return;
    const o = w.o;
    const a = this.gripPoint('L', new THREE.Vector3());
    for (let i = 0; i < 3; i++) raidenArc(g, a, o.center(), 0.22);
    g.damage(o, 24 * this.dmgK(), f, _v.subVectors(o.pos, f.pos).setY(0).normalize().clone(), { knock: 0, energy: true, hitstop: 0.08 });
    this.paralyse(o, 1.5);
  }

  /** G: chain-life */
  private setLife(on: boolean): void {
    const { f, g } = this;
    this.lifeOn = on;
    if (on) {
      g.callout('', 'THE CHAIN IS LIFE', HISAGI_GREEN.body);
      f.aura.flare(1.3, 0.3);
    }
    this.applyStats();
  }

  // ---------------------------------------------------------------- Fushi no Kōjō

  /** the share of both their reiatsu left in the pool (0..1) */
  pool(): number {
    const l = this.link;
    if (!l) return 1;
    return (this.f.rei + l.o.rei) / Math.max(1, this.f.maxRei + l.o.maxRei);
  }

  private castNoose(): void {
    const { f, g } = this;
    const t = this.target(16);
    if (!t || !this.orb) {
      if (f === g.player) g.hud?.showBanner('No one to link', 1.2);
      return;
    }
    this.orb.noose(t);
    const prev = t.parry;
    this.link = { o: t, prevParry: prev };
    t.parry = (amount, from, o) => (prev ? prev(amount, from, o) : false) || this.payLink(amount, from);
    g.callout('', 'LINKED — NEITHER OF YOU WILL DIE', HISAGI_GREEN.body);
  }

  /** a wound on either side, re-linked at once: paid twice over from both their reiatsu */
  private payLink(amount: number, from: Fighter | null): boolean {
    const l = this.link;
    if (!l) return false;
    const cost = amount * (from ? from.power : 1) * 2;
    const half = cost / 2;
    const f = this.f, o = l.o;
    let a = Math.min(f.rei, half), b = Math.min(o.rei, half);
    // one side dry: the other pays the rest
    if (a < half) b = Math.min(o.rei, cost - a);
    if (b < half) a = Math.min(f.rei, cost - b);
    f.rei -= a;
    o.rei -= b;
    const c = o.center();
    this.g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 0.4, sizeEnd: 1.2, life: 0.2, r: 0.4, g: 0.9, b: 0.5, alpha: 0.6, alphaEnd: 0, tex: TEX_GLOW });
    if (f.rei + o.rei <= 0.5) this.snap();
    return true;
  }

  /** the pool ran dry: the link snaps and both reel */
  private snap(): void {
    const l = this.link;
    if (!l) return;
    this.unlink();
    for (const x of [this.f, l.o]) {
      if (x.dead) continue;
      x.stopAction();
      x.hitstun = Math.max(x.hitstun, 1);
    }
    this.g.callout('', 'THE POOL RAN DRY', '#B9C4BD');
  }

  private unlink(): void {
    const l = this.link;
    if (!l) return;
    this.link = null;
    l.o.parry = l.prevParry;
    this.orb?.unnoose(l.o);
  }

  private rain(): void {
    const { f, g } = this;
    if (!this.orb) return;
    const t = this.target(24);
    const at = t ? t.pos.clone() : f.pos.clone().addScaledVector(f.forward(), 7);
    this.orb.rain(at, 7, 0.8);
  }

  private tethers(): void {
    const { f, g } = this;
    const o = this.target(18);
    if (!o || !this.orb) return;
    // chains from the orb seize them and drag them in to his feet
    const d = _v.subVectors(f.pos, o.pos).setY(0);
    const dist = d.length();
    if (dist > 1.5) o.push.addScaledVector(d.normalize(), Math.min(60, (dist - 1.5) * 7));
    if (!o.def.boss) {
      o.stopAction();
      o.hitstun = Math.max(o.hitstun, 0.6);
    }
    g.damage(o, 10 * this.dmgK(), f, d.clone(), { knock: 0, quiet: true });
    this.orb.rain(o.pos.clone(), 2, 0.1);
  }

  private cutOwnNoose(): void {
    const { f, g } = this;
    const l = this.link;
    if (!l) return;
    // he can only finish it unlinked: the price is his own blood
    this.unlink();
    g.drain(f, f.hp * 0.6, null);
    g.callout('', "HANGMAN'S VERDICT", HISAGI_GREEN.body);
    this.verdictOn = l.o;
  }

  private verdictOn: Fighter | null = null;

  private verdictStrike(): void {
    const { f, g } = this;
    const o = this.verdictOn;
    this.verdictOn = null;
    if (!o || o.dead) return;
    if (o.pos.distanceTo(f.pos) > 4) {
      // the verdict comes to them: a step and the blow
      const back = _v.subVectors(f.pos, o.pos).setY(0).normalize().multiplyScalar(1.4);
      f.body.pos.set(o.pos.x + back.x, o.pos.y, o.pos.z + back.z);
      f.ghosts.spawn(0.3, 0.5);
    }
    g.damage(o, 140 * this.dmgK(), f, _v.subVectors(o.pos, f.pos).setY(0).normalize().clone(), { knock: 18, launch: 6, heavy: true, hitstop: 0.2, shake: 0.9, unblockable: true });
    g.slowMo(0.4, 0.35);
    g.groundImpact(o.pos.clone(), 2, 400, HISAGI_GREEN.body, f);
  }

  private updateBankai(): void {
    const { f, g } = this;
    const orb = this.orb;
    if (!orb) return;
    // reishi stagnates round the orb: enemies' reiatsu does not come back
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      const last = this.reiSeen.get(o.id);
      if (last !== undefined && o.rei > last && o.pos.distanceTo(f.pos) < 12) o.rei = last;
      this.reiSeen.set(o.id, o.rei);
    }
    if (this.link && (this.link.o.dead || !g.fighters.includes(this.link.o))) this.unlink();
  }

  // ---------------------------------------------------------------- forms

  toShikai(): void {
    const { f, g } = this;
    if (this.form === 'bankai') {
      this.unlink();
      this.orb?.dissolve();
      this.orb = null;
      this.form = 'shikai';
      this.applyLook();
      this.applyStats();
      g.sfx.play('ting', f.center(), 0.6);
      return;
    }
    this.form = 'shikai';
    f.visual.attach('sword', hisagiProp('sickle'), 'grip.R');
    f.visual.attach('sickleL', hisagiProp('sickle'), 'grip.L');
    if (!this.heldChain || this.heldChain.done) {
      this.heldChain = new HeldChain(g, f, (a, b) => {
        this.butt('R', a);
        this.butt('L', b);
      });
      g.addProjectile(this.heldChain);
    }
    f.anim.loco.stance = KAZESHINI_STANCE;
    f.def = { ...f.def, stance: KAZESHINI_STANCE, blade: SICKLE };
    f.bladeValid = false;
    f.trail?.reset();
    this.raidenT = 0;
    this.hands();
    f.aura.flare(1.6, 0.5);
    // the split: a burst of green round the blades
    const c = f.center();
    for (let i = 0; i < 24; i++) g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: (Math.random() - 0.5) * 9, vy: Math.random() * 5, vz: (Math.random() - 0.5) * 9, size: 0.12, sizeEnd: 0.02, life: 0.5, r: 0.5, g: 1.6, b: 0.7, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 2 });
    g.sfx.play('flare', f.center(), 0.8);
    this.applyLook();
    this.applyStats();
  }

  toBankai(): void {
    const { f, g } = this;
    if (this.form !== 'shikai') return;
    this.form = 'bankai';
    this.orb = new FushiOrb(g, f, hisagiProp('orb'), () => this.socketPoint('choker', new THREE.Vector3()));
    this.orb.onStrike = (p) => {
      for (const o of g.enemiesOf(f)) {
        if (o.dead) continue;
        if (Math.hypot(o.pos.x - p.x, o.pos.z - p.z) > 1.1 + o.def.radius || Math.abs(o.pos.y - p.y) > 2.5) continue;
        g.damage(o, 14 * this.dmgK(), f, _v.subVectors(o.pos, p).setY(0).normalize().clone(), { knock: 6, launch: 3, hitstop: 0.05 });
      }
      g.engine.destruction.carve(new CapsuleShape(p.clone().setY(p.y + 3), p.clone().setY(p.y - 0.4), 0.3), { mode: 'cut', power: 300, dust: 0.6 });
    };
    g.addProjectile(this.orb);
    this.reiSeen.clear();
    f.aura.pillarBurst(2);
    f.aura.flare(2, 0.6);
    g.sfx.play('bankai', f.center(), 0.8);
    g.shake(f === g.player ? 0.6 : 0.2);
    this.applyLook();
    this.applyStats();
    if (f === g.player) g.hud?.showBanner('Fushi no Kōjō — link them (Q): neither of you can die while the pool lasts', 2.6);
  }

  private applyLook(): void {
    const { f, g } = this;
    f.aura.setStyle(AURA);
    f.ghosts.color.set(AURA.body);
    f.trail?.setColor(TRAIL.color, TRAIL.core);
    if (g.hud && f === g.player) g.hud.form = this.formName();
  }

  private applyStats(): void {
    const f = this.f;
    const form = this.form === 'sealed' ? 1 : this.form === 'shikai' ? 1.35 : 1.45;
    f.power = form * (this.flare ? 1.25 : 1);
    f.aura.target = this.flare ? 1 : this.form === 'sealed' ? 0.12 : this.form === 'shikai' ? 0.3 : 0.45;
  }

  /** before a hit lands: chain-life and the life-link take it in reiatsu */
  private parry(amount: number, from: Fighter | null, o: DamageOpts): boolean {
    const { f, g } = this;
    if (f.dead) return false;
    // the bound fighter's blows shake the chain off
    if (this.wrap && from === this.wrap.o && !o.quiet) this.wrap.shaken++;
    if (this.link) return this.payLink(amount, from);
    if (this.lifeOn && !o.quiet) {
      const cost = amount * (from ? from.power : 1) * 1.2;
      if (f.rei < cost) return false;
      f.rei -= cost;
      const c = f.center();
      for (let i = 0; i < 6; i++) g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: (Math.random() - 0.5) * 3, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 3, size: 0.07, sizeEnd: 0.02, life: 0.4, r: 0.5, g: 1.4, b: 0.6, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
      f.anim.flinch(-140, 0);
      return true;
    }
    return false;
  }

  socketPoint(socket: string, out: THREE.Vector3): THREE.Vector3 {
    const s = this.f.visual.rig.sockets.get(socket);
    if (!s) return this.f.center(out);
    s.updateWorldMatrix(true, false);
    return s.getWorldPosition(out);
  }

  formName(): string {
    if (this.form === 'sealed') return `Kazeshini (sealed) · bands ${this.bandsLeft}` + (this.raidenT > 0 ? ' · Tsuzuri Raiden' : '');
    const fear = this.fear > 0.05 ? ` · fear ${Math.round(this.fear * 100)}%` : '';
    if (this.form === 'shikai') return 'Shikai — Kazeshini' + (this.lifeOn ? ' · chain-life' : '') + fear;
    return 'Bankai — Fushi no Kōjō' + (this.link ? ` · pool ${Math.round(this.pool() * 100)}%` : '') + fear;
  }

  ai(): KitAI {
    const sealed = () => this.form === 'sealed', shikai = () => this.form === 'shikai', bankai = () => this.form === 'bankai';
    const tgt = () => this.g.nearestEnemy(this.f, 60);
    const airborne = () => {
      const t = tgt();
      return !!t && !t.grounded;
    };
    const hands = () => !this.out.R && !this.out.L;
    return {
      reach: this.form === 'sealed' ? 2.0 : 6.0,
      chain: 4,
      // he would rather not: the Shikai only when it goes badly, the Bankai when it is going worse
      releaseAt: [0.6, 0.25],
      ranged: () => this.form !== 'sealed',
      moves: [
        { name: 'draw', use: () => this.heavy(), min: 0, max: 2.8, weight: 1.1, cd: 3, when: sealed },
        { name: 'rod', use: () => this.skill1(), min: 3, max: 18, weight: 1.1, cd: 6, when: sealed },
        { name: 'band', use: () => this.skill2(), min: 2, max: 12, weight: 0.9, cd: 6, when: () => sealed() && this.bandsLeft > 0 },
        { name: 'raiden', use: () => this.skill3(), min: 0, max: 8, weight: 0.8, cd: 10, when: () => sealed() && this.raidenT <= 0 },
        { name: 'sajo', use: () => this.toggle(), min: 2, max: 14, weight: 0.7, cd: 9, when: sealed },
        { name: 'fan', use: () => this.heavy(), min: 0, max: 3.4, weight: 1.3, cd: 4, when: () => shikai() && hands() },
        { name: 'steer', use: () => this.skill1(), min: 4, max: 15, weight: 1.6, cd: 4, when: () => shikai() && !this.out.R },
        { name: 'kubi', use: () => this.skill2(), min: 3, max: 10, weight: 1.2, cd: 5, when: () => shikai() && !this.out.R },
        { name: 'kubi air', use: () => this.skill2(), min: 2, max: 10, weight: 3, cd: 5, when: () => shikai() && !this.out.R && airborne() },
        { name: 'bind', use: () => this.skill3(), min: 3, max: 10, weight: 1.1, cd: 7, when: () => shikai() && !this.out.L },
        { name: 'life', use: () => this.toggle(), min: 0, max: 40, weight: 0.8, cd: 15, when: () => shikai() && !this.lifeOn && this.f.hp < this.f.maxHp * 0.5 && this.f.rei > 60 },
        { name: 'noose', use: () => this.skill1(), min: 0, max: 15, weight: 4, cd: 5, when: () => bankai() && !this.link },
        { name: 'rain', use: () => this.heavy(), min: 3, max: 18, weight: 1.3, cd: 4, when: bankai },
        { name: 'tether', use: () => this.skill2(), min: 5, max: 16, weight: 1, cd: 6, when: bankai },
        { name: 'verdict', use: () => this.skill3(), min: 0, max: 20, weight: 6, cd: 3, when: () => bankai() && !!this.link && this.pool() <= 0.25 },
        { name: 'band b', use: () => this.toggle(), min: 2, max: 12, weight: 0.6, cd: 8, when: () => bankai() && this.bandsLeft > 0 },
      ],
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const flare = { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare };
    if (this.form === 'sealed') {
      return [
        { key: 'LMB', name: 'Kenjutsu', kanji: '剣', active: this.raidenT > 0, timer: this.raidenT > 0 ? this.raidenT / RAIDEN_T : undefined, tint: '#CFE8FF' },
        { key: 'RMB', name: 'Draw-cut', kanji: '抜', cost: 6, cd: cd.draw, cdMax: 2.4 },
        { key: 'Q', name: 'Hyapporankan', kanji: '百歩欄干', cost: 14, cd: cd.rod, cdMax: 8, tint: '#D6ECFF' },
        { key: 'E', name: `Explosive band (${this.bandsLeft})`, kanji: '爆', cost: 6, cd: this.bandsLeft > 0 ? cd.band : 3, cdMax: 3 },
        { key: 'R', name: 'Tsuzuri Raiden', kanji: '綴雷電', cost: 10, cd: cd.raiden, cdMax: 9, active: this.raidenT > 0, tint: '#CFE8FF' },
        { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
        flare,
        { key: 'F', name: 'Kare, Kazeshini', kanji: '刈', cost: 20, tint: HISAGI_GREEN.body },
        { key: 'G', name: 'Sajō Sabaku', kanji: '鎖条鎖縛', cost: 12, cd: cd.sajo, cdMax: 9, tint: '#F2D04A' },
      ];
    }
    const fearBar = { key: 'LMB', name: `Kazeshini · fear ${Math.round(this.fear * 100)}%`, kanji: '風死', timer: this.fear, tint: HISAGI_GREEN.body };
    if (this.form === 'shikai') {
      return [
        fearBar,
        { key: 'RMB', name: 'Fan spin', kanji: '旋', cost: 14, cd: cd.fan, cdMax: 4.5 },
        { key: 'Q', name: 'Steered throw', kanji: '操', cost: 12, cd: cd.steer, cdMax: 4 },
        { key: 'E', name: 'Kubikake', kanji: '首挂', cost: 14, cd: cd.kubi, cdMax: 5 },
        { key: 'R', name: 'Chain bind', kanji: '縛', cost: 16, cd: cd.bind, cdMax: 7 },
        { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
        flare,
        { key: 'F', name: 'Bankai', kanji: '卍解', cost: 40, tint: HISAGI_GREEN.body },
        { key: 'G', name: this.lifeOn ? 'Chain-life (on)' : 'Chain-life', kanji: '命', cost: 6, cd: cd.life, cdMax: 2, active: this.lifeOn },
      ];
    }
    return [
      fearBar,
      { key: 'RMB', name: 'Chain rain', kanji: '鎖雨', cost: 16, cd: cd.rain, cdMax: 4 },
      { key: 'Q', name: this.link ? 'Linked' : 'Noose link', kanji: '絞縄', cost: 20, cd: cd.noose, cdMax: 6, active: !!this.link, timer: this.link ? this.pool() : undefined },
      { key: 'E', name: 'Orb tethers', kanji: '鎖', cost: 14, cd: cd.tether, cdMax: 5 },
      { key: 'R', name: "Hangman's Verdict", kanji: '断', cd: cd.verdict, cdMax: 3, active: !!this.link && this.pool() <= 0.25 },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
      flare,
      { key: 'F', name: 'Unlink (Shikai)', kanji: '解' },
      { key: 'G', name: `Explosive band (${this.bandsLeft})`, kanji: '爆', cost: 6, cd: this.bandsLeft > 0 ? cd.band : 3, cdMax: 3 },
    ];
  }
}
