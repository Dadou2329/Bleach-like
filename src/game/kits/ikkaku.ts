// Ikkaku Madarame's kit (docs/roster/C1-lieutenants-1.md §Ikkaku). Three steps on F.
// Sealed: the sword in his right hand, the sheath reversed in his left — a cut, the sheath hook, a thrust, sword
// and sheath slammed down together (LMB); the crossed press that shoves through any guard (RMB); the hand swap,
// the sword tossed to his left hand for a cut from the side nobody watched — it goes round parries (Q); the
// headbutt (E); the styptic in the hilt (R, three a fight); Tsuki-Tsuki no Mai, the lucky dance (G: he hits harder
// for a while and now and then a blow just misses him).
// F: "Nobiro, Hōzukimaru" — the hilt slammed into the sheath: the spear. Thrusts, the tassel-end jab, the sweep, a
// turn and a thrust (LMB); the overhead smash that cracks the street (RMB); "Sakero" — the spear comes apart into
// the three-section staff and the head section folds round the guard (Q, unblockable); the head section hurled on
// its chain (E); the styptic (R); the dance (G).
// F again: "Bankai — Ryūmon Hōzukimaru", in a tornado of red reiatsu: the guandao and the monk's spade in his hands,
// the great centre blade floating behind him on its chains, a dragon crest on its face that turns red as blows are
// traded — dealt or taken — and faster while he spins; the redder the crest, the harder he hits. LMB: guandao,
// spade, guandao rising, both crashed down in an X with the centre blade falling after; RMB: the leap and X crash
// (with a full crest, the Full-Crest Clash through everything in line, after which the crest burns low); Q: the
// Ryūmon spin, the rig a pinwheel that cuts all round him and swats shots away (Q again to stop); E: the spade flung
// on its chain; R: the centre blade hurled like a guillotine wheel and hauled back; F: the reiatsu explosion (the
// centre blade spun overhead and slammed down, a red blast and a screen of smoke); G: "Wake up, Hōzukimaru!" — he
// takes a blow on purpose for the crest and answers it with the X.
import * as THREE from 'three';
import { FighterAction, type BladeSpec, type Fighter, type FighterDef } from '../fighter';
import type { DamageOpts, Game } from '../game';
import { CENTER_RING, GUANDAO_HEAD, HEAD_LEN, KATANA_BASE_Z, KATANA_TIP_Z, POLE_RING_Z, SPADE_HEAD, SPEAR_BUTT_Z, SPEAR_HEAD_Z, SPEAR_TIP_Z, ikkakuAsset, ikkakuProp } from '../../chars/ikkaku';
import { HOZUKIMARU_CHAIN, HOZUKIMARU_CLIPS, HOZUKIMARU_STANCE, IKKAKU_CHAIN, IKKAKU_CLIPS, IKKAKU_STANCE, RYUMON_CHAIN, RYUMON_CLIPS, RYUMON_STANCE } from '../../chars/ikkakuClips';
import type { AuraStyle } from '../../vfx/aura';
import { IKKAKU_RED, ReiatsuTornado, RyumonRig, luckyFx, reiatsuBlast, slamFlash, stypticFx } from '../../vfx/ryumon';
import { TetherBlade, type TetherStyle } from '../../vfx/shiro';
import { groundAt } from '../../vfx/iceArts';
import { BoxShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_STREAK } from '../../vfx/sprites';
import type { AbilityInfo } from '../../ui/hud';
import type { Kit, KitAI } from './kit';
import { aimPoint } from './vasto';

type BladeDef = NonNullable<FighterDef['blade']>;
type Form = 'sealed' | 'shikai' | 'bankai';

/** red reiatsu; the Bankai's deeper */
const AURA_IKKAKU: AuraStyle = { core: IKKAKU_RED.core, body: IKKAKU_RED.body, rim: IKKAKU_RED.rim };
const AURA_RYUMON: AuraStyle = { core: '#FFD8CE', body: '#F02E38', rim: '#9A0F16' };
const TRAIL = { color: '#F06A6A', core: '#FFF1EC' };
const KATANA: BladeDef = { prop: 'sword', base: [0, 0, KATANA_BASE_Z], tip: [0, 0, KATANA_TIP_Z], ...TRAIL };
const SPEAR: BladeDef = { prop: 'sword', base: [0, 0, SPEAR_HEAD_Z], tip: [0, 0, SPEAR_TIP_Z], ...TRAIL };
/** the tassel end of the spear (the jab back into him) */
const SPEAR_BUTT: BladeDef = { prop: 'sword', base: [0, 0, -0.4], tip: [0, 0, SPEAR_BUTT_Z - 0.1], ...TRAIL };
const GUANDAO: BladeDef = { prop: 'sword', base: [0, 0, GUANDAO_HEAD[0] - 0.1], tip: [0, 0, GUANDAO_HEAD[1]], ...TRAIL };
const SPADE: BladeDef = { prop: 'spade', base: [0, 0, SPADE_HEAD[0] - 0.1], tip: [0, 0, SPADE_HEAD[1]], ...TRAIL };
/** the head section of the Shikai on its chain */
const HEAD_TETHER: TetherStyle = { kind: 'chain', color: '#6C7076', length: HEAD_LEN, butt: 0, cutR: 0.32, glow: '#FF8A80', thick: 0.02 };
/** the spade on its heavy chain */
const SPADE_TETHER: TetherStyle = { kind: 'chain', color: '#4A4D52', length: SPADE_HEAD[1], butt: POLE_RING_Z, cutR: 0.5, glow: '#FF6A6A', thick: 0.036 };

const FORM_SPEED: Record<Form, FighterDef['speed']> = {
  sealed: { run: 10.5, sprint: 22, jump: 12, dash: 13, dashTime: 0.11 },
  shikai: { run: 10.5, sprint: 22, jump: 12, dash: 13, dashTime: 0.11 },
  bankai: { run: 9.5, sprint: 19, jump: 11, dash: 11, dashTime: 0.12 },
};
const STYPTIC_USES = 3;
/** the crest: per point of damage dealt / taken, per second of spinning */
const CREST_DEALT = 1 / 700;
const CREST_TAKEN = 1 / 450;
const CREST_SPIN = 0.1;

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

const sealedProps = () => [
  { key: 'sword', model: ikkakuProp('katana'), socket: 'grip.R' },
  { key: 'sheath', model: ikkakuProp('sheath'), socket: 'grip.L' },
];

export const IKKAKU_DEF: FighterDef = {
  id: 'ikkaku',
  name: 'Ikkaku Madarame',
  title: '3rd Seat, 11th Division',
  build: () => ({ asset: ikkakuAsset(), props: sealedProps() }),
  stance: IKKAKU_STANCE,
  clips: IKKAKU_CLIPS,
  aura: AURA_IKKAKU,
  blade: KATANA,
  hp: 1050,
  rei: 150,
  speed: { ...FORM_SPEED.sealed },
  radius: 0.4,
  height: 1.82,
};

// ------------------------------------------------------------------ helpers

/** push toward the target so the blow lands at `stop` metres, timed to arrive by `at` seconds */
function lungeTo(f: Fighter, stop: number, at: number, max = 28): number {
  const tgt = f.faceTarget;
  if (!tgt) return 0;
  const d = Math.hypot(tgt.x - f.pos.x, tgt.z - f.pos.z);
  if (d <= stop + 0.25 || d > 9) return 0;
  const per = (1 - Math.exp(-f.pushDrag * Math.max(0.06, at - 0.05))) / f.pushDrag;
  f.push.addScaledVector(f.forward(_v), Math.min(max, (d - stop) / per));
  return stop;
}

/** stop the lunge once the target is reached */
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
  unblockable?: boolean;
  stun?: number;
}

interface Win {
  at: [number, number];
  spec: BladeSpec;
  /** the blade that strikes (defaults to the form's own) */
  blade?: BladeDef;
  /** the spade strikes too (the X) */
  both?: boolean;
}

interface Move {
  windows?: Win[];
  /** a blow at the clip's 'hit' event (the sheath hook) */
  blow?: Blow;
  /** crack the ground under the blade's point at [time, radius] */
  crack?: [number, number];
  /** the centre blade falls after the X at this time */
  swoop?: number;
}

const spec = (damage: number, knock: number, cut: number, extra: Partial<BladeSpec> = {}): BladeSpec => ({ damage, knock, launch: 0, hitstop: 0.05, shake: 0.14, cut, ...extra });

const MOVES: Record<string, Move> = {
  ik_s1: { windows: [{ at: [0.1, 0.24], spec: spec(20, 8, 380) }] },
  ik_s2: { blow: { damage: 16, knock: 9, launch: 1, reach: 0.95, y: 1.4, r: 0.8 } },
  ik_s3: { windows: [{ at: [0.1, 0.26], spec: spec(20, 11, 380) }] },
  ik_s4: { windows: [{ at: [0.2, 0.36], spec: spec(30, 14, 480, { launch: 2, heavy: true, hitstop: 0.08, shake: 0.3 }) }], crack: [0.33, 1.1] },
  ik_k1: { windows: [{ at: [0.1, 0.26], spec: spec(22, 10, 420, { reach: 0.22 }) }] },
  ik_k2: { windows: [{ at: [0.1, 0.26], spec: spec(18, 13, 160, { launch: 2, reach: 0.3 }), blade: SPEAR_BUTT }] },
  ik_k3: { windows: [{ at: [0.1, 0.27], spec: spec(24, 12, 460, { reach: 0.25 }) }] },
  ik_k4: { windows: [{ at: [0.1, 0.32], spec: spec(14, 1.5, 300, { reach: 0.25 }) }, { at: [0.34, 0.5], spec: spec(32, 18, 520, { launch: 2, heavy: true, hitstop: 0.08, shake: 0.3, reach: 0.22 }) }] },
  ik_b1: { windows: [{ at: [0.14, 0.31], spec: spec(34, 14, 700, { launch: 1, hitstop: 0.07, shake: 0.25, reach: 0.32, thick: 0.1 }), blade: GUANDAO }] },
  ik_b2: { windows: [{ at: [0.14, 0.31], spec: spec(34, 14, 700, { launch: 2, hitstop: 0.07, shake: 0.25, reach: 0.36, thick: 0.1 }), blade: SPADE }] },
  ik_b3: { windows: [{ at: [0.14, 0.31], spec: spec(30, 6, 700, { launch: 4.5, hitstop: 0.07, shake: 0.25, reach: 0.32, thick: 0.1 }), blade: GUANDAO }] },
  ik_b4: { windows: [{ at: [0.24, 0.4], spec: spec(30, 16, 800, { launch: 3, heavy: true, hitstop: 0.1, shake: 0.45, reach: 0.34, thick: 0.1 }), blade: GUANDAO, both: true }], crack: [0.37, 1.8], swoop: 0.44 },
};

/** a second blade's sweep (the spade in the X), sampled per step */
class SideSweep {
  private pb = new THREE.Vector3();
  private pt = new THREE.Vector3();
  private cb = new THREE.Vector3();
  private ct = new THREE.Vector3();
  private ok = false;
  readonly hits = new Set<number>();
  step(g: Game, f: Fighter, def: BladeDef, s: BladeSpec, active: boolean): void {
    const p = f.visual.props.get(def.prop);
    if (!p || !p.visible) {
      this.ok = false;
      return;
    }
    p.updateWorldMatrix(true, false);
    this.cb.set(...def.base).applyMatrix4(p.matrixWorld);
    this.ct.set(...def.tip).applyMatrix4(p.matrixWorld);
    if (this.ok && active) g.bladeSweep(f, this.pb, this.pt, this.cb, this.ct, s, this.hits);
    this.pb.copy(this.cb);
    this.pt.copy(this.ct);
    this.ok = true;
  }
}

/** Marker for the skills a string can cancel into. */
abstract class SkillAction extends FighterAction {}

// ------------------------------------------------------------------ the strings (all three forms)

/** One move of the light string: a cut, the sheath hook, a spear stroke, a Ryūmon blow. */
class MoveAction extends FighterAction {
  readonly name: string;
  private info: Move;
  private dur = 0;
  private comboAt = 0;
  private stopAt = 0;
  private win = -1;
  private cracked = false;
  private swooped = false;
  private side = new SideSweep();
  queued = false;
  constructor(readonly kit: IkkakuKit, readonly clip: string, readonly index: number, private boost = 1) {
    super();
    this.name = clip;
    this.info = MOVES[clip];
    this.mobility = 0.12;
    this.airGravity = 0.12;
    if (clip === 'ik_b4') this.armor = 0.35;
  }
  override start(f: Fighter, g: Game): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    this.comboAt = c.events.combo ?? this.dur * 0.6;
    f.bladeHits.clear();
    const w0 = this.info.windows?.[0];
    if (w0) this.kit.useBlade(w0.blade ?? this.kit.baseBlade());
    const at = w0 ? w0.at[0] : c.events.hit ?? 0.2;
    this.stopAt = lungeTo(f, this.kit.stopDistance(), at);
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n === 'hit' && this.info.blow) this.kit.blow(this.info.blow);
        if (n === 'step') g.sfx.play('step', f.pos, 0.5);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    this.stopAt = lungeStop(f, this.stopAt);
    const ws = this.info.windows;
    if (ws) {
      // a little ahead of each window: its blade, its blow, a fresh list of who was hit
      let pre = -1, cur = -1;
      for (let i = 0; i < ws.length; i++) {
        if (t >= ws[i].at[0] - 0.04 && t <= ws[i].at[1]) pre = i;
        if (t >= ws[i].at[0] && t <= ws[i].at[1]) cur = i;
      }
      if (pre >= 0 && pre !== this.win) {
        if (pre > 0) this.stopAt = lungeTo(f, this.kit.stopDistance(), 0.12);
        this.win = pre;
        const w = ws[pre];
        this.kit.useBlade(w.blade ?? this.kit.baseBlade());
        f.bladeHits.clear();
        f.bladeSpec = { ...w.spec, damage: w.spec.damage * this.boost };
        g.sfx.play(w.spec.heavy || this.kit.form === 'bankai' ? 'swingHeavy' : 'swing', f.center());
      }
      f.bladeActive = cur >= 0;
      if (f.trail) f.trail.emitting = pre >= 0;
      // the X: the spade bites too
      const w = cur >= 0 ? ws[cur] : pre >= 0 ? ws[pre] : null;
      if (w?.both && f.bladeSpec) this.side.step(g, f, SPADE, f.bladeSpec, cur >= 0);
    }
    if (this.info.crack && !this.cracked && t >= this.info.crack[0]) {
      this.cracked = true;
      const tip = f.blade.tip;
      const gy = groundAt(g, tip.x, tip.y + 0.5, tip.z, 2);
      if (gy !== null && tip.y - gy < 1.0) g.groundImpact(new THREE.Vector3(tip.x, gy, tip.z), this.info.crack[1], 220, f.def.aura.body, f);
    }
    if (this.info.swoop !== undefined && !this.swooped && t >= this.info.swoop) {
      this.swooped = true;
      this.kit.rig?.swoop(spec(26 * this.boost, 12, 900, { launch: 4, heavy: true, hitstop: 0.08, shake: 0.4, reach: 0.4, thick: 0.12 }));
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
    this.kit.useBlade(this.kit.baseBlade());
  }
  override canCancel(next: FighterAction): boolean {
    const ws = this.info.windows;
    const w = ws ? ws[ws.length - 1].at[1] : 0.3;
    if (next.name === 'dash') return this.t >= w;
    return next instanceof SkillAction && this.t >= w + 0.04;
  }
}

// ------------------------------------------------------------------ sealed

/** RMB: sword and sheath crossed and shoved — through any guard, off balance. */
class PressAction extends SkillAction {
  readonly name = 'press';
  private stopAt = 0;
  private hit = false;
  constructor(readonly kit: IkkakuKit) {
    super();
    this.mobility = 0.1;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    this.stopAt = lungeTo(f, 1.0, 0.24, 30);
    g.sfx.play('swingHeavy', f.center(), 0.7);
    f.anim.play('ik_press', {
      onEvent: (n) => {
        if (n === 'hit' && !this.hit) {
          this.hit = true;
          this.kit.blow({ damage: 26, knock: 22, launch: 1, heavy: true, reach: 1.05, y: 1.3, r: 0.95, unblockable: true, stun: 0.9 });
        }
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.stopAt = lungeStop(f, this.stopAt);
    if (this.t >= 0.55) this.done = true;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > 0.36;
  }
}

/** Q: the hand swap — the sword tossed across to his left hand and a cut from the side nobody was watching. */
class SwapAction extends SkillAction {
  readonly name = 'swap';
  private stopAt = 0;
  private swapped = false;
  private back = false;
  constructor(readonly kit: IkkakuKit) {
    super();
    this.mobility = 0.1;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = spec(32, 12, 500, { launch: 2, heavy: true, hitstop: 0.1, shake: 0.35, unblockable: true });
    this.stopAt = lungeTo(f, 1.3, 0.26, 30);
    f.anim.play('ik_swap', {
      onEvent: (n) => {
        if (n === 'toss') {
          const s = f.visual.props.get('sword');
          if (s) s.visible = false;
          g.sfx.play('swing', f.center(), 0.5);
        }
        if (n === 'swap') this.swap(true);
        if (n === 'back') this.swap(false);
      },
    });
  }
  private swap(on: boolean): void {
    if (on ? this.swapped : this.back) return;
    if (on) this.swapped = true;
    else this.back = true;
    this.kit.swapHands(on);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.stopAt = lungeStop(f, this.stopAt);
    const t = this.t;
    if (t >= 0.23 && !this.swapped) this.swap(true);
    if (t >= 0.24 && t < 0.26) g.sfx.play('swingHeavy', f.center());
    f.bladeActive = this.swapped && !this.back && t >= 0.26 && t <= 0.42;
    if (f.trail) f.trail.emitting = this.swapped && !this.back && t >= 0.24 && t <= 0.48;
    if (t >= 0.62 && !this.back) this.swap(false);
    if (t >= 0.66) this.done = true;
  }
  override end(f: Fighter): void {
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
    if (this.swapped && !this.back) this.swap(false);
    const s = f.visual.props.get('sword');
    if (s) s.visible = true;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > 0.45;
  }
}

/** E: the headbutt — he grabs, and the bald head comes down on the face. */
class HeadbuttAction extends SkillAction {
  readonly name = 'headbutt';
  private stopAt = 0;
  private hit = false;
  constructor(readonly kit: IkkakuKit) {
    super();
    this.mobility = 0.1;
  }
  override start(f: Fighter): void {
    this.stopAt = lungeTo(f, 0.85, 0.26, 30);
    f.anim.play('ik_butt', {
      onEvent: (n) => {
        if (n === 'hit' && !this.hit) {
          this.hit = true;
          this.kit.blow({ damage: 26, knock: 9, launch: 6, heavy: true, reach: 0.75, y: 1.62, r: 0.72, stun: 0.7 });
        }
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.stopAt = lungeStop(f, this.stopAt);
    if (this.t >= 0.56) this.done = true;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > 0.36;
  }
}

/** R: the pommel off and the paste smeared on the wound. */
class StypticAction extends SkillAction {
  readonly name = 'styptic';
  private healed = false;
  constructor(readonly kit: IkkakuKit) {
    super();
    this.mobility = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('ik_styptic', {
      onEvent: (n) => {
        if (n === 'open') {
          g.sfx.play('ting', f.center(), 0.5);
          stypticFx(g, this.kit.gripPoint('grip.R', _v));
        }
        if (n === 'smear') this.heal();
      },
    });
  }
  private heal(): void {
    if (this.healed) return;
    this.healed = true;
    this.kit.styptic();
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 0.75) this.heal();
    if (this.t >= 1.15) this.done = true;
  }
}

/** G: Tsuki-Tsuki no Mai — the lucky dance. Struck while dancing, the luck is gone. */
class DanceAction extends SkillAction {
  readonly name = 'dance';
  private hp = 0;
  private lucky = false;
  constructor(readonly kit: IkkakuKit) {
    super();
    this.mobility = 0.15;
  }
  override start(f: Fighter, g: Game): void {
    this.hp = f.hp;
    f.anim.play('ik_dance', {
      onEvent: (n) => {
        if (n === 'chant') g.callout('ツイてる ツイてる', 'TSUITERU, TSUITERU, TSUITTERU~!', '#FFD86A');
        if (n === 'lucky') this.luck();
      },
    });
  }
  private luck(): void {
    if (this.lucky) return;
    this.lucky = true;
    this.kit.luck();
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (f.hp < this.hp - 0.5) {
      // struck mid-dance: no luck today
      if (f === g.player) g.hud?.showBanner('Not so lucky…', 1.4);
      f.anim.stopAll(0.12);
      this.done = true;
      return;
    }
    if (Math.random() < 0.4) luckyFx(g, f, 2);
    if (this.t >= 1.42) this.luck();
    if (this.t >= 1.5) this.done = true;
  }
}

/** F (sealed): "Nobiro, Hōzukimaru" — the hilt slammed into the sheath, and they are one spear. */
class NobiroAction extends SkillAction {
  readonly name = 'release';
  private fused = false;
  constructor(readonly kit: IkkakuKit) {
    super();
    this.mobility = 0;
    this.armor = 0.6;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('ik_nobiro', { onEvent: (n) => n === 'fuse' && this.fuse(g) });
  }
  private fuse(g: Game): void {
    if (this.fused) return;
    this.fused = true;
    g.callout('延びろ「鬼灯丸」', 'NOBIRO, HŌZUKIMARU', IKKAKU_RED.body);
    slamFlash(g, this.kit.gripPoint('grip.L', _v));
    g.sfx.play('flare', this.kit.f.center(), 0.8);
    this.kit.toShikai();
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 0.46) this.fuse(g);
    if (this.t >= 0.92) this.done = true;
  }
}

// ------------------------------------------------------------------ Shikai

/** RMB (Shikai): the spear brought down two-handed — the street cracks under it. */
class SmashAction extends SkillAction {
  readonly name = 'smash';
  private stopAt = 0;
  private hit = false;
  constructor(readonly kit: IkkakuKit) {
    super();
    this.mobility = 0.08;
    this.armor = 0.4;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = spec(34, 10, 600, { launch: 4, heavy: true, hitstop: 0.1, shake: 0.4, reach: 0.28, thick: 0.1 });
    this.stopAt = lungeTo(f, 1.8, 0.3, 26);
    f.anim.play('ik_smash', {
      onEvent: (n) => {
        if (n === 'hit' && !this.hit) {
          this.hit = true;
          this.kit.quake(f.blade.tip, 2.0, 24);
        }
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.stopAt = lungeStop(f, this.stopAt);
    const t = this.t;
    if (t >= 0.28 && t < 0.3) g.sfx.play('swingHeavy', f.center());
    f.bladeActive = t >= 0.3 && t <= 0.46;
    if (f.trail) f.trail.emitting = t >= 0.28 && t <= 0.5;
    if (t >= 0.74) this.done = true;
  }
  override end(f: Fighter): void {
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > 0.55;
  }
}

/**
 * Q (Shikai): "Sakero" — the thrust is met, and the spear comes apart: the head section on its chain folds over
 * and round the guard. Unblockable. The pieces join again by themselves.
 */
class SakeroAction extends SkillAction {
  readonly name = 'sakero';
  private stopAt = 0;
  private split = false;
  private tether: TetherBlade | null = null;
  private rejoined = false;
  constructor(readonly kit: IkkakuKit) {
    super();
    this.mobility = 0.08;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    f.bladeSpec = spec(12, 4, 300, { reach: 0.22 });
    this.stopAt = lungeTo(f, 1.75, 0.14, 30);
    g.callout('裂けろ「鬼灯丸」', 'SAKERO, HŌZUKIMARU', IKKAKU_RED.body);
    f.anim.play('ik_sakero', {
      onEvent: (n) => {
        if (n === 'split') this.doSplit(f, g);
        if (n === 'rejoin') this.tether?.reel();
      },
    });
  }
  private doSplit(f: Fighter, g: Game): void {
    if (this.split) return;
    this.split = true;
    f.bladeActive = false;
    const t = this.kit.splitSpear();
    this.tether = t;
    // folding over the top and round: the plane holds the thrust line and the side the target is on, tipped up
    const fw = f.forward(new THREE.Vector3());
    const side = new THREE.Vector3(fw.z, 0, -fw.x);
    const tg = f.faceTarget;
    if (tg && side.dot(_v.subVectors(tg, f.pos)) < 0) side.negate();
    const v = side.multiplyScalar(0.75).add(new THREE.Vector3(0, 0.66, 0)).normalize();
    t.orbit({
      center: () => this.kit.staffEnd(new THREE.Vector3()),
      u: fw,
      v,
      radius: 0.16,
      a0: 0,
      a1: 2.5,
      dur: 0.3,
      ease: (k) => 1 - (1 - k) ** 3,
      hit: { damage: 36, knock: 12, launch: 3, heavy: true, cut: 380, hitstop: 0.1, unblockable: true },
      hold: false,
    });
    g.sfx.play('swingHeavy', f.center(), 1);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.stopAt = lungeStop(f, this.stopAt);
    const t = this.t;
    if (!this.split) {
      f.bladeActive = t >= 0.04 && t <= 0.18;
      if (t >= 0.22) this.doSplit(f, g);
    }
    if (this.tether && !this.rejoined && (this.tether.done || this.tether.caught)) {
      this.rejoined = true;
      this.kit.joinSpear();
    }
    if (t >= 0.95) this.done = true;
  }
  override end(f: Fighter): void {
    f.bladeActive = false;
    if (this.tether && !this.tether.done) this.tether.done = true;
    if (this.split && !this.rejoined) this.kit.joinSpear();
  }
}

/** E (Shikai): the head section flung out on its chain — it knocks a man flying — and hauled back. */
class HurlAction extends SkillAction {
  readonly name = 'hurl';
  private tether: TetherBlade | null = null;
  private thrown = false;
  private rejoined = false;
  constructor(readonly kit: IkkakuKit) {
    super();
    this.mobility = 0.2;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('ik_hurl', { hold: true, onEvent: (n) => n === 'throw' && this.throw(f, g) });
  }
  private throw(f: Fighter, g: Game): void {
    if (this.thrown) return;
    this.thrown = true;
    const t = this.kit.splitSpear();
    this.tether = t;
    t.throwAt(aimPoint(f, g, new THREE.Vector3()), { speed: 36, range: 16, spin: false, hit: { damage: 30, knock: 28, launch: 6, heavy: true, cut: 420, hitstop: 0.09 } });
    g.sfx.play('swingHeavy', f.center(), 1.1);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 0.24) this.throw(f, g);
    if (this.tether && !this.rejoined && (this.tether.done || this.tether.caught)) {
      this.rejoined = true;
      this.kit.joinSpear();
      this.done = true;
    }
    if (this.t >= 2.2) this.done = true;
  }
  override end(f: Fighter): void {
    f.anim.stopAll(0.15);
    if (this.tether && !this.tether.done) this.tether.done = true;
    if (this.thrown && !this.rejoined) this.kit.joinSpear();
  }
}

/** F (Shikai): "Bankai — Ryūmon Hōzukimaru": the pieces slammed together overhead, a tornado of red reiatsu. */
class BankaiAction extends SkillAction {
  readonly name = 'release';
  private slammed = false;
  private formed = false;
  constructor(readonly kit: IkkakuKit) {
    super();
    this.mobility = 0;
    this.armor = 0.8;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('ik_bankai', {
      onEvent: (n) => {
        if (n === 'raise') {
          this.kit.glowWeapon(IKKAKU_RED.body, 0.5);
          g.sfx.play('flare', f.center(), 0.7);
        }
        if (n === 'slam') this.slam(f, g);
        if (n === 'form') this.form();
      },
    });
  }
  private slam(f: Fighter, g: Game): void {
    if (this.slammed) return;
    this.slammed = true;
    g.callout('卍解「龍紋鬼灯丸」', 'BANKAI — RYŪMON HŌZUKIMARU', IKKAKU_RED.body);
    slamFlash(g, this.kit.gripPoint('grip.R', _v));
    g.addProjectile(new ReiatsuTornado(g, f, 1.8));
    this.kit.shove(7, 18);
    f.aura.flare(2.2, 0.9);
    g.shake(f === g.player ? 0.7 : 0.25);
  }
  private form(): void {
    if (this.formed) return;
    this.formed = true;
    this.kit.toBankai();
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 0.64) this.slam(f, g);
    if (this.t >= 1.04) this.form();
    if (this.t >= 1.35) this.done = true;
  }
  override end(): void {
    if (this.slammed) this.form();
  }
}

// ------------------------------------------------------------------ Bankai

/** RMB (Bankai): the leap, both blades over his head, the X crash. With a full crest: the Full-Crest Clash. */
class XCrashAction extends SkillAction {
  readonly name = 'xcrash';
  private stopAt = 0;
  private jumped = false;
  private crashed = false;
  private side = new SideSweep();
  constructor(readonly kit: IkkakuKit, readonly clash: boolean) {
    super();
    this.mobility = 0.15;
    this.airGravity = 1;
    this.armor = clash ? 0.8 : 0.5;
  }
  override start(f: Fighter, g: Game): void {
    f.bladeHits.clear();
    this.kit.useBlade(GUANDAO);
    f.bladeSpec = spec(this.clash ? 60 : 40, 18, 950, { launch: 4, heavy: true, hitstop: 0.12, shake: 0.5, reach: 0.36, thick: 0.12, unblockable: this.clash });
    if (this.clash) {
      g.callout('龍紋', 'FULL-CREST CLASH', '#FF3B3B');
      f.aura.flare(2.4, 1);
      if (f === g.player) g.slowMo(0.35, 0.5);
    }
    f.anim.play('ik_xcrash', {
      onEvent: (n) => {
        if (n === 'jump') this.jump(f);
        if (n === 'crash') this.crash(f, g);
      },
    });
  }
  private jump(f: Fighter): void {
    if (this.jumped) return;
    this.jumped = true;
    // a short hop (the clip lifts him further): down again as the blades come down
    f.body.vel.y = Math.max(f.body.vel.y, 4.5);
    f.hovering = false;
    this.stopAt = lungeTo(f, 1.6, 0.3, this.clash ? 40 : 30);
  }
  private crash(f: Fighter, g: Game): void {
    if (this.crashed) return;
    this.crashed = true;
    this.kit.crash(this.clash);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    this.stopAt = lungeStop(f, this.stopAt);
    const t = this.t;
    if (t >= 0.2) this.jump(f);
    if (t >= 0.38 && t < 0.4) g.sfx.play('swingHeavy', f.center(), 1.3);
    // the blades come down with him into the landing (inExpo: most of the arc at the end)
    f.bladeActive = t >= 0.4 && t <= 0.58;
    if (f.trail) f.trail.emitting = t >= 0.38 && t <= 0.62;
    if (f.bladeSpec) this.side.step(g, f, SPADE, f.bladeSpec, f.bladeActive);
    if (t >= 0.55) this.crash(f, g);
    if (t >= 0.9) this.done = true;
  }
  override end(f: Fighter): void {
    f.bladeActive = false;
    if (f.trail) f.trail.emitting = false;
    if (this.clash) this.kit.burnCrest();
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' && this.t > 0.7;
  }
}

/** Q (Bankai): the Ryūmon spin — the centre handle in both hands, the whole rig a pinwheel round him. */
class SpinAction extends SkillAction {
  readonly name = 'spin';
  stop = false;
  private whoosh = 0;
  private dur: number;
  constructor(readonly kit: IkkakuKit, dur = 2.6) {
    super();
    this.mobility = 0.55;
    this.dur = dur;
    this.armor = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    this.kit.spinning = true;
    this.kit.rig?.hold(true, spec(16, 5, 650, { launch: 1, hitstop: 0.03, shake: 0.12, reach: 0.36, thick: 0.1 }));
    f.anim.play('ik_spin', {});
    g.sfx.play('swingHeavy', f.center(), 1.2);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const t = this.t;
    // shots that come in are swatted away
    if (t > 0.25) {
      const n = g.rejectNear(f.center(), 4.2, f, false);
      if (n > 0) {
        this.kit.addCrest(0.03 * n);
        g.sfx.play('ting', f.center(), 0.8);
      }
    }
    this.whoosh -= dt;
    if (this.whoosh <= 0) {
      this.whoosh = 0.24;
      g.sfx.play('swing', f.center(), 0.7);
    }
    // the wind of it
    if (Math.random() < 0.6) {
      const a = Math.random() * Math.PI * 2, r = 1.5 + Math.random() * 2.5;
      g.engine.dust.spawn({ x: f.pos.x + Math.cos(a) * r, y: f.pos.y + 0.2, z: f.pos.z + Math.sin(a) * r, vx: -Math.sin(a) * 7, vy: 1.5, vz: Math.cos(a) * 7, size: 0.5, sizeEnd: 1.5, life: 0.7, r: 0.6, g: 0.52, b: 0.48, alpha: 0.4, alphaEnd: 0, tex: TEX_GLOW, drag: 1.2 });
    }
    if (this.stop || t >= this.dur) this.done = true;
  }
  override end(f: Fighter): void {
    this.kit.spinning = false;
    this.kit.rig?.hold(false);
    f.anim.stopAll(0.2);
  }
  override canCancel(next: FighterAction): boolean {
    return next.name === 'dash' || next instanceof SkillAction;
  }
}

/** E (Bankai): the spade flung on its chain from the left hand, and yanked back. */
class ChainThrowAction extends SkillAction {
  readonly name = 'chainthrow';
  private tether: TetherBlade | null = null;
  private thrown = false;
  constructor(readonly kit: IkkakuKit) {
    super();
    this.mobility = 0.25;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('ik_fling', { hold: true, onEvent: (n) => n === 'throw' && this.throw(f, g) });
  }
  private throw(f: Fighter, g: Game): void {
    if (this.thrown) return;
    this.thrown = true;
    this.tether = this.kit.flingSpade(aimPoint(f, g, new THREE.Vector3()));
    g.sfx.play('swingHeavy', f.center(), 1.2);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 0.22) this.throw(f, g);
    if (this.tether && (this.tether.done || this.tether.caught)) this.done = true;
    if (this.t >= 2.4) this.done = true;
  }
  override end(f: Fighter): void {
    f.anim.stopAll(0.15);
    if (this.tether && !this.tether.done) this.tether.done = true;
    this.kit.spadeHome();
  }
}

/** R (Bankai): the centre blade hurled like a guillotine wheel — it rolls out cutting and comes back on the chains. */
class CenterHurlAction extends SkillAction {
  readonly name = 'centerhurl';
  private thrown = false;
  constructor(readonly kit: IkkakuKit) {
    super();
    this.mobility = 0.3;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('ik_b4', {});
    g.sfx.play('swingHeavy', f.center(), 1);
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    const rig = this.kit.rig;
    if (!this.thrown && this.t >= 0.32) {
      this.thrown = true;
      if (rig) {
        const at = aimPoint(f, g, new THREE.Vector3());
        at.y = Math.max(at.y, f.pos.y + 1.0);
        rig.throwAt(at, { speed: 30, range: 22, damage: 52, knock: 20, cut: 1000 });
        g.sfx.play('getsuga', f.center(), 0.9);
      }
    }
    if (this.thrown && (!rig || rig.hurlDone) && this.t > 0.6) this.done = true;
    if (this.t >= 2.6) {
      rig?.recall();
      this.done = true;
    }
  }
}

/** F (Bankai): the reiatsu explosion — the centre blade raised, spun overhead and slammed into the ground. */
class ExplosionAction extends SkillAction {
  readonly name = 'explosion';
  private slammed = false;
  constructor(readonly kit: IkkakuKit) {
    super();
    this.mobility = 0;
    this.armor = 0.6;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('ik_explode', {
      onEvent: (n) => {
        if (n === 'raise') {
          this.kit.rig?.hold(true, spec(10, 4, 420, { hitstop: 0.02, shake: 0.08, reach: 0.3 }));
          f.aura.flare(1.8, 0.8);
          g.sfx.play('flare', f.center(), 0.9);
        }
        if (n === 'slam') this.slam(f, g);
      },
    });
  }
  private slam(f: Fighter, g: Game): void {
    if (this.slammed) return;
    this.slammed = true;
    this.kit.explode();
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 1.02) this.slam(f, g);
    if (this.t >= 1.3) this.kit.rig?.hold(false);
    if (this.t >= 1.45) this.done = true;
  }
  override end(): void {
    this.kit.rig?.hold(false);
  }
}

/** G (Bankai): "Wake up, Hōzukimaru!" — braced, daring the blow; taken, it feeds the crest and he answers with the X. */
class WakeAction extends SkillAction {
  readonly name = 'wake';
  constructor(readonly kit: IkkakuKit) {
    super();
    this.mobility = 0;
  }
  override start(f: Fighter): void {
    f.anim.play('ik_wake', {});
    this.kit.waking = true;
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 0.8) this.kit.waking = false;
    if (this.t >= 0.86) this.done = true;
  }
  override end(): void {
    this.kit.waking = false;
  }
}

// ------------------------------------------------------------------ the kit

export class IkkakuKit implements Kit {
  form: Form = 'sealed';
  comboIndex = 0;
  private lastSwingEnd = 0;
  flare = false;
  readonly cd = { press: 0, swap: 0, butt: 0, styptic: 0, dance: 0, smash: 0, sakero: 0, hurl: 0, xcrash: 0, spin: 0, chain: 0, center: 0, explode: 0, wake: 0 };
  /** styptic uses left this fight */
  stypticLeft = STYPTIC_USES;
  /** the lucky dance's luck (s) */
  luckyT = 0;
  /** Bankai: the dragon crest (0…1), the rig, the spin, the dare */
  crest = 0;
  rig: RyumonRig | null = null;
  spinning = false;
  waking = false;
  private dealt = 0;
  private crestFull = false;
  /** the Full-Crest Clash is under way: its own blows feed nothing */
  private crestLock = false;
  private hudT = 0;
  private spadeTether: TetherBlade | null = null;

  constructor(readonly f: Fighter, readonly g: Game) {
    f.data.kit = this;
    f.parry = (amount, from, o) => this.parry(amount, from, o);
    f.onHurt = (dmg) => {
      if (this.form === 'bankai') this.addCrest(dmg * CREST_TAKEN);
    };
    this.dealt = f.stats.damageDealt;
    this.hands();
    this.applyLook();
    this.applyStats();
  }

  /** a weapon in each hand: fists both */
  private hands(): void {
    const rig = this.f.visual.rig;
    rig.setBoneVisible('fist.R', true);
    rig.setBoneVisible('fist.L', true);
    rig.setBoneVisible('palm.R', false);
    rig.setBoneVisible('palm.L', false);
  }

  update(dt: number): void {
    const { f, g } = this;
    for (const k of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[k] = Math.max(0, this.cd[k] - dt);
    if (this.flare) {
      f.rei -= dt * 6;
      if (f.rei <= 0) this.toggleFlare();
    }
    if (this.luckyT > 0) {
      this.luckyT -= dt;
      if (Math.random() < 0.12) luckyFx(g, f, 1);
      if (this.luckyT <= 0) this.applyStats();
    }
    // the crest: blows dealt (and taken, through onHurt), and the spin
    const d = f.stats.damageDealt - this.dealt;
    this.dealt = f.stats.damageDealt;
    if (this.form === 'bankai') {
      if (d > 0) this.addCrest(d * CREST_DEALT);
      if (this.spinning) this.addCrest(dt * CREST_SPIN);
      if (this.rig) this.rig.crest = this.crest;
      this.hudT -= dt;
      if (this.hudT <= 0 && g.hud && f === g.player) {
        this.hudT = 0.25;
        g.hud.form = this.formName();
      }
    }
    if (this.rig && this.rig.done) this.rig = null;
  }

  /** after the Full-Crest Clash: the overstrained blades, the crest burnt low */
  burnCrest(): void {
    this.crestLock = false;
    this.crest = 0.3;
    this.applyStats();
    if (this.rig) this.rig.crest = this.crest;
  }

  addCrest(k: number): void {
    if (this.form !== 'bankai' || k <= 0 || this.crestLock) return;
    const before = this.crest;
    this.crest = Math.min(1, this.crest + k);
    if (this.crest !== before) this.applyStats();
    if (this.crest >= 1 && !this.crestFull) {
      this.crestFull = true;
      const { f, g } = this;
      g.callout('龍紋', 'THE DRAGON CREST BURNS RED', '#FF3B3B');
      f.aura.flare(2, 0.8);
      g.sfx.play('bankai', f.center(), 0.7);
    }
    if (this.crest < 1) this.crestFull = false;
  }

  // ---------------------------------------------------------------- inputs

  attack(): void {
    const f = this.f;
    const cur = f.action;
    if (cur instanceof MoveAction) {
      if (cur.index >= 0) cur.queued = true;
      return;
    }
    if (f.busy) return;
    if (this.g.time - this.lastSwingEnd > 0.8) this.comboIndex = 0;
    this.chain(this.comboIndex);
  }

  chain(i: number): void {
    const list = this.form === 'bankai' ? RYUMON_CHAIN : this.form === 'shikai' ? HOZUKIMARU_CHAIN : IKKAKU_CHAIN;
    const idx = i % list.length;
    this.comboIndex = idx + 1;
    this.lastSwingEnd = this.g.time + 0.8;
    this.f.act(new MoveAction(this, list[idx], idx), true);
  }

  /** RMB: the crossed press / the smash / the X crash (the Full-Crest Clash) */
  heavy(): void {
    if (this.form === 'sealed') this.special(new PressAction(this), 6, 'press', 2.6);
    else if (this.form === 'shikai') this.special(new SmashAction(this), 10, 'smash', 3.2);
    else {
      const clash = this.crest >= 1;
      if (this.special(new XCrashAction(this, clash), clash ? 30 : 12, 'xcrash', clash ? 5 : 3.4) && clash) this.crestLock = true;
    }
  }

  /** Q: the hand swap / "Sakero" / the Ryūmon spin (Q again stops it) */
  skill1(): void {
    if (this.form === 'sealed') this.special(new SwapAction(this), 8, 'swap', 3);
    else if (this.form === 'shikai') this.special(new SakeroAction(this), 12, 'sakero', 3.6);
    else {
      const a = this.f.action;
      if (a instanceof SpinAction) {
        a.stop = true;
        return;
      }
      if (this.bladeOut()) return;
      this.special(new SpinAction(this), 16, 'spin', 5);
    }
  }

  /** E: the headbutt / the hurled segment / the spade on its chain */
  skill2(): void {
    if (this.form === 'sealed') this.special(new HeadbuttAction(this), 4, 'butt', 3);
    else if (this.form === 'shikai') this.special(new HurlAction(this), 12, 'hurl', 4);
    else if (!this.spadeTether) this.special(new ChainThrowAction(this), 14, 'chain', 4.5);
  }

  /** R: the styptic / the centre blade hurled */
  skill3(): void {
    if (this.form === 'bankai') {
      if (this.bladeOut()) return;
      this.special(new CenterHurlAction(this), 22, 'center', 6);
      return;
    }
    if (this.stypticLeft <= 0) {
      if (this.f === this.g.player) this.g.hud?.showBanner('The hilt is empty');
      return;
    }
    if (this.f.hp >= this.f.maxHp) return;
    this.special(new StypticAction(this), 0, 'styptic', 8);
  }

  /** G: the lucky dance / "Wake up, Hōzukimaru!" */
  toggle(): void {
    if (this.form === 'bankai') this.special(new WakeAction(this), 6, 'wake', 5);
    else this.special(new DanceAction(this), 0, 'dance', 18);
  }

  /** F: "Nobiro" / "Bankai" / the reiatsu explosion */
  release(): void {
    const f = this.f;
    if (this.form === 'bankai') {
      if (this.bladeOut()) return;
      this.special(new ExplosionAction(this), 40, 'explode', 12);
      return;
    }
    if (f.busy) return;
    if (this.form === 'sealed') {
      if (!f.spendRei(16)) {
        if (f === this.g.player) this.g.hud?.showBanner('Not enough reiatsu');
        return;
      }
      f.act(new NobiroAction(this), true);
      return;
    }
    if (!f.spendRei(40)) {
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
      this.addCrest(0.04);
    }
  }

  /** the centre blade is still out on its chains (hurled): the moves that need it wait */
  private bladeOut(): boolean {
    const out = !this.rig || this.rig.mode === 'hurl';
    if (out && this.f === this.g.player) this.g.hud?.showBanner('The centre blade is still out', 1.2);
    return out;
  }

  private target(): Fighter | null {
    return this.g.nearestEnemy(this.f, 80, this.f.forward(), 70) ?? this.g.nearestEnemy(this.f, 80);
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

  // ---------------------------------------------------------------- blows

  stopDistance(): number {
    return this.form === 'bankai' ? 2.0 : this.form === 'shikai' ? 1.7 : 1.25;
  }

  /** the form's own striking blade */
  baseBlade(): BladeDef {
    return this.form === 'bankai' ? GUANDAO : this.form === 'shikai' ? SPEAR : KATANA;
  }

  /** strike with this blade (the blade def follows; the samples and the trail start fresh) */
  useBlade(def: BladeDef): void {
    const f = this.f;
    if (f.def.blade === def) return;
    f.def = { ...f.def, blade: def };
    f.bladeValid = false;
    f.trail?.reset();
  }

  /** a blow in front of him (the sheath hook, the press, the headbutt) */
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
      g.damage(o, s.damage, f, fw.clone(), { knock: s.knock, launch: s.launch, heavy: s.heavy, hitstop: s.heavy ? 0.1 : 0.05, shake: s.heavy ? 0.35 : 0.14, unblockable: s.unblockable });
      if (s.stun && !o.def.boss && !o.dead) {
        o.stopAction();
        o.hitstun = Math.max(o.hitstun, s.stun);
      }
      g.sparks(new THREE.Vector3(o.pos.x, cy, o.pos.z), fw, IKKAKU_RED.body, s.heavy ? 14 : 6);
    }
    g.sfx.play(hit ? 'impact' : 'swing', p, hit ? 0.9 : 0.5);
  }

  /** the spear's smash: a crater under the point, a quake round it */
  quake(at: THREE.Vector3, radius: number, damage: number): void {
    const { f, g } = this;
    const gy = groundAt(g, at.x, at.y + 0.6, at.z, 3);
    if (gy === null || at.y - gy > 1.4) return;
    const p = new THREE.Vector3(at.x, gy, at.z);
    g.groundImpact(p.clone(), radius, 300, IKKAKU_RED.body, f);
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      const d = Math.hypot(o.pos.x - p.x, o.pos.z - p.z);
      if (d > radius * 1.7 + o.def.radius || o.pos.y - gy > 1.5) continue;
      g.damage(o, damage * (1 - d / (radius * 2.2)), f, _v.subVectors(o.pos, p).setY(0).normalize().clone(), { knock: 9, launch: 7, heavy: true, hitstop: 0.08, shake: 0.4 });
    }
    g.shake(f === g.player ? 0.45 : 0.15);
  }

  /** the X crash's landing (and the Full-Crest Clash through everything in line) */
  crash(clash: boolean): void {
    const { f, g } = this;
    const fw = f.forward();
    const p = f.pos.clone().addScaledVector(fw, 1.9);
    const gy = groundAt(g, p.x, f.pos.y + 1, p.z, 3) ?? f.pos.y;
    p.y = gy;
    g.groundImpact(p.clone(), clash ? 3.2 : 2.4, clash ? 700 : 420, IKKAKU_RED.body, f);
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      const d = Math.hypot(o.pos.x - p.x, o.pos.z - p.z);
      if (d > 4.5 + o.def.radius || o.pos.y - gy > 2) continue;
      g.damage(o, 28 * (1 - d / 6), f, _v.subVectors(o.pos, p).setY(0).normalize().clone(), { knock: 14, launch: 8, heavy: true, hitstop: 0.08, shake: 0.5 });
    }
    g.shake(f === g.player ? 0.6 : 0.2);
    if (!clash) return;
    // all three blades driven on through everything in line
    const len = 22;
    const c = f.pos.clone().addScaledVector(fw, len * 0.5 + 1).setY(f.pos.y + 1.7);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), fw);
    g.engine.destruction.carve(new BoxShape(c, new THREE.Vector3(1.6, 2.6, len * 0.5), q), { mode: 'cut', power: 1800, dir: fw.clone(), sparks: [1, 0.4, 0.38], dust: 0.8 });
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      _v.subVectors(o.pos, f.pos);
      const along = _v.dot(fw);
      const across = Math.abs(_v.x * fw.z - _v.z * fw.x);
      if (along < 0 || along > len + 1 || across > 1.8 + o.def.radius) continue;
      g.damage(o, 110, f, fw.clone(), { knock: 36, launch: 10, heavy: true, hitstop: 0.18, shake: 0.9, unblockable: true });
    }
    this.rig?.throwAt(f.pos.clone().addScaledVector(fw, 30).setY(f.pos.y + 1.4), { speed: 46, range: 20, damage: 40, knock: 22, cut: 1200 });
    // the overstrained edges: steel chips off the guandao
    const s = f.visual.props.get('sword');
    if (s) {
      s.updateWorldMatrix(true, false);
      const tip = _w.set(0, 0, GUANDAO_HEAD[1] * 0.8).applyMatrix4(s.matrixWorld);
      for (let i = 0; i < 26; i++) g.engine.glow.spawn({ x: tip.x, y: tip.y, z: tip.z, vx: (Math.random() - 0.5) * 9, vy: Math.random() * 7, vz: (Math.random() - 0.5) * 9, size: 0.08, sizeEnd: 0.03, life: 0.8, r: 0.85, g: 0.88, b: 0.92, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 1.5, gravity: -12 });
    }
    if (f === g.player) g.hud?.showBanner('The blades are brittle — the crest burns low', 2);
  }

  /** the reiatsu explosion where the centre blade comes down */
  explode(): void {
    const { f, g } = this;
    const fw = f.forward();
    const p = f.pos.clone().addScaledVector(fw, 1.6);
    p.y = groundAt(g, p.x, f.pos.y + 1, p.z, 3) ?? f.pos.y;
    const r = 5 + this.crest * 2;
    reiatsuBlast(g, p, r);
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      _v.subVectors(o.pos, p);
      const d = _v.length();
      if (d > r + 2 + o.def.radius) continue;
      _v.setY(0).normalize();
      g.damage(o, 66 * (1 - d / (r + 4)), f, _v.clone(), { knock: 30 * (1 - d / (r + 3)) + 8, launch: 9, heavy: true, hitstop: 0.12, shake: 0.8, energy: true });
    }
    g.shake(f === g.player ? 0.9 : 0.3);
    f.aura.flare(2, 0.6);
  }

  /** the release's burst: everyone near thrown back */
  shove(radius: number, damage: number): void {
    const { f, g } = this;
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      _v.subVectors(o.pos, f.pos).setY(0);
      const d = _v.length();
      if (d > radius + o.def.radius) continue;
      _v.normalize();
      g.damage(o, damage * (1 - d / (radius * 1.5)), f, _v.clone(), { knock: 30 * (1 - d / (radius * 1.4)) + 8, launch: 6, heavy: true, hitstop: 0.1, shake: 0.6, energy: true });
    }
  }

  /** a socket's world position */
  gripPoint(socket: string, out: THREE.Vector3): THREE.Vector3 {
    const s = this.f.visual.rig.sockets.get(socket);
    if (!s) return this.f.center(out);
    s.updateWorldMatrix(true, false);
    return s.getWorldPosition(out);
  }

  // ---------------------------------------------------------------- the sealed sword

  /** the sword to the left hand and the sheath to the right (or back) */
  swapHands(on: boolean): void {
    const f = this.f;
    const v = f.visual;
    v.moveProp('sword', on ? 'grip.L' : 'grip.R');
    v.moveProp('sheath', on ? 'grip.R' : 'grip.L');
    const s = v.props.get('sword');
    if (s) s.visible = true;
    f.bladeValid = false;
    f.trail?.reset();
    if (on) f.ghosts.spawn(0.3, 0.5);
  }

  styptic(): void {
    const { f, g } = this;
    this.stypticLeft--;
    f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.15);
    stypticFx(g, f.center());
    g.sfx.play('purify', f.center(), 0.5);
    if (f === g.player) g.hud?.showBanner(`Styptic — ${this.stypticLeft} left`, 1.6);
  }

  luck(): void {
    const { f, g } = this;
    this.luckyT = 15;
    this.applyStats();
    luckyFx(g, f, 24);
    g.addRing(f.pos.clone().setY(f.pos.y + 0.1), 3, '#FFD86A', 0.4);
    g.sfx.play('flare', f.center(), 0.5);
  }

  /** before a hit lands: the dare of "Wake up" and the lucky dodge */
  private parry(amount: number, from: Fighter | null, o: DamageOpts): boolean {
    const { f, g } = this;
    if (f.dead || o.quiet) return false;
    if (this.waking && this.form === 'bankai') {
      // taken on purpose: a little of it hurts, the crest drinks the rest, and the X answers
      this.waking = false;
      g.drain(f, amount * 0.3 * (from ? from.power : 1), from);
      this.addCrest(0.2);
      g.callout('起きろ「鬼灯丸」', 'WAKE UP, HŌZUKIMARU!', IKKAKU_RED.body);
      g.sfx.play('hitHeavy', f.center(), 1);
      g.addRing(f.center(), 2.4, IKKAKU_RED.body, 0.3);
      f.aura.flare(1.8, 0.5);
      if (from) f.faceTarget = from.center();
      f.stopAction();
      f.act(new MoveAction(this, 'ik_b4', 3, 1.4), true);
      return true;
    }
    if (this.luckyT > 0 && amount >= 8 && Math.random() < 0.3) {
      // tsuiteru: it just misses him
      const side = _v.set(Math.cos(f.yaw), 0, -Math.sin(f.yaw)).multiplyScalar(Math.random() < 0.5 ? 1 : -1);
      f.push.addScaledVector(side, 9);
      f.ghosts.spawn(0.3, 0.7);
      g.callout('', 'TSUITERU!', '#FFD86A');
      g.sfx.play('swing', f.center(), 0.6);
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- the spear

  /** the far end of the staff (where the head section hangs on its chain) */
  staffEnd(out: THREE.Vector3): THREE.Vector3 {
    const s = this.f.visual.props.get('sword');
    if (!s) return this.f.center(out);
    s.updateWorldMatrix(true, false);
    return out.set(0, 0, SPEAR_HEAD_Z).applyMatrix4(s.matrixWorld);
  }

  /** "Sakero": the spear comes apart — the staff stays in his hands, the head section goes on its chain */
  splitSpear(): TetherBlade {
    const { f, g } = this;
    f.visual.attach('sword', ikkakuProp('staff'), 'grip.R');
    f.bladeValid = false;
    const t = new TetherBlade(g, f, ikkakuProp('head'), () => this.staffEnd(new THREE.Vector3()), HEAD_TETHER);
    g.addProjectile(t);
    return t;
  }

  /** the sections lock together again */
  joinSpear(): void {
    const f = this.f;
    if (this.form !== 'shikai') return;
    f.visual.attach('sword', ikkakuProp('spear'), 'grip.R');
    f.bladeValid = false;
    this.g.sfx.play('ting', f.center(), 0.4);
  }

  /** the weapon's energy glow (a colour, or null to fade) */
  glowWeapon(color: string | null, a: number): void {
    const s = this.f.visual.props.get('sword');
    const u = s?.material.userData.uniforms;
    if (!u?.uEnergy) return;
    if (color) {
      const c = new THREE.Color(color);
      u.uEnergy.value.set(c.r, c.g, c.b, a);
    } else u.uEnergy.value.w = a;
  }

  // ---------------------------------------------------------------- Ryūmon Hōzukimaru

  /** the spade off the left hand on its chain (the chain runs back to the centre blade) */
  flingSpade(at: THREE.Vector3): TetherBlade {
    const { f, g } = this;
    const rig = this.rig;
    const hand = new THREE.Vector3();
    // flying out, the chain runs back to the centre blade's ring; coming home, he hauls it in by hand
    let t: TetherBlade | null = null;
    t = new TetherBlade(g, f, ikkakuProp('spade'), () => {
      if (t && rig && !rig.done && (t.mode === 'throw' || t.mode === 'stuck')) return rig.local(-CENTER_RING[0], CENTER_RING[1], 0, hand);
      return this.gripPoint('grip.L', hand);
    }, SPADE_TETHER);
    g.addProjectile(t);
    t.throwAt(at, { speed: 34, range: 20, spin: true, hit: { damage: 38, knock: 18, launch: 4, heavy: true, cut: 700, hitstop: 0.09 } });
    if (rig) rig.spadeOut = true;
    this.spadeTether = t;
    return t;
  }

  spadeHome(): void {
    if (this.rig) this.rig.spadeOut = false;
    this.spadeTether = null;
  }

  // ---------------------------------------------------------------- forms

  toShikai(): void {
    const f = this.f;
    this.form = 'shikai';
    f.def = { ...f.def, stance: HOZUKIMARU_STANCE, clips: HOZUKIMARU_CLIPS, speed: { ...FORM_SPEED.shikai } };
    f.setForm({ asset: ikkakuAsset(), props: [{ key: 'sword', model: ikkakuProp('spear'), socket: 'grip.R' }] }, AURA_IKKAKU, SPEAR);
    f.anim.twoHandGap = 0.3;
    this.hands();
    this.applyLook();
    this.applyStats();
  }

  toBankai(): void {
    const { f, g } = this;
    this.form = 'bankai';
    this.crest = 0;
    this.crestFull = false;
    f.def = { ...f.def, stance: RYUMON_STANCE, clips: RYUMON_CLIPS, speed: { ...FORM_SPEED.bankai } };
    f.setForm({ asset: ikkakuAsset(), props: [{ key: 'sword', model: ikkakuProp('guandao'), socket: 'grip.R' }, { key: 'spade', model: ikkakuProp('spade'), socket: 'grip.L' }] }, AURA_RYUMON, GUANDAO);
    this.hands();
    this.rig = new RyumonRig(g, f);
    g.addProjectile(this.rig);
    this.applyLook();
    this.applyStats();
    if (f === g.player) g.hud?.showBanner('Ryūmon Hōzukimaru — trade blows to wake the dragon', 2.6);
  }

  private applyLook(): void {
    const { f, g } = this;
    const style = this.form === 'bankai' ? AURA_RYUMON : AURA_IKKAKU;
    f.aura.setStyle(style);
    f.ghosts.color.set(style.body);
    f.trail?.setColor(TRAIL.color, TRAIL.core);
    if (g.hud && f === g.player) g.hud.form = this.formName();
  }

  private applyStats(): void {
    const f = this.f;
    const base = this.form === 'sealed' ? 1.0 : this.form === 'shikai' ? 1.15 : 1.3 + 0.8 * this.crest;
    f.power = base * (this.flare ? 1.25 : 1) * (this.luckyT > 0 ? 1.2 : 1);
    f.damageTaken = this.form === 'bankai' ? 0.9 : 1;
    f.aura.target = this.flare ? 1 : this.form === 'sealed' ? 0.15 : this.form === 'shikai' ? 0.3 : 0.4 + 0.5 * this.crest;
  }

  formName(): string {
    if (this.form === 'sealed') return 'Hōzukimaru (sealed)' + (this.luckyT > 0 ? ' · lucky' : '');
    if (this.form === 'shikai') return 'Shikai — Hōzukimaru' + (this.luckyT > 0 ? ' · lucky' : '');
    return `Bankai — Ryūmon Hōzukimaru · crest ${Math.round(this.crest * 100)}%`;
  }

  ai(): KitAI {
    const sealed = () => this.form === 'sealed', shikai = () => this.form === 'shikai', bankai = () => this.form === 'bankai';
    const floating = () => bankai() && this.rig !== null && this.rig.mode === 'float';
    return {
      reach: this.form === 'bankai' ? 3.0 : this.form === 'shikai' ? 2.5 : 2.0,
      chain: 4,
      // the spear early (he loves a fight); the Bankai he hides until he is really hurt
      releaseAt: [0.88, 0.34],
      moves: [
        { name: 'press', use: () => this.heavy(), min: 0, max: 2.6, weight: 1.2, cd: 3, when: sealed },
        { name: 'swap', use: () => this.skill1(), min: 0, max: 3.2, weight: 1.4, cd: 3.5, when: sealed },
        { name: 'butt', use: () => this.skill2(), min: 0, max: 2.2, weight: 1, cd: 3.5, when: sealed },
        { name: 'styptic', use: () => this.skill3(), min: 5, max: 60, weight: 2, cd: 8, when: () => !bankai() && this.stypticLeft > 0 && this.f.hp < this.f.maxHp * 0.55 },
        { name: 'dance', use: () => this.toggle(), min: 7, max: 60, weight: 0.7, cd: 20, when: () => !bankai() && this.luckyT <= 0 },
        { name: 'smash', use: () => this.heavy(), min: 0, max: 3.4, weight: 1.2, cd: 3.5, when: shikai },
        { name: 'sakero', use: () => this.skill1(), min: 0.5, max: 3.6, weight: 1.6, cd: 4, when: shikai },
        { name: 'hurl', use: () => this.skill2(), min: 4, max: 14, weight: 1.6, cd: 4.5, when: shikai },
        { name: 'xcrash', use: () => this.heavy(), min: 0, max: 6, weight: 1.4, cd: 3.5, when: bankai },
        { name: 'spin', use: () => this.skill1(), min: 0, max: 4.2, weight: 1.9, cd: 6, when: () => floating() && this.f.rei >= 16 },
        { name: 'chain', use: () => this.skill2(), min: 5, max: 19, weight: 1.6, cd: 5, when: () => bankai() && !this.spadeTether },
        { name: 'center', use: () => this.skill3(), min: 6, max: 22, weight: 1.4, cd: 6, when: floating },
        { name: 'explode', use: () => this.release(), min: 0, max: 6, weight: 1.5, cd: 12, when: () => floating() && this.crest > 0.35 && this.f.rei >= 40 },
        { name: 'wake', use: () => this.toggle(), min: 0, max: 3, weight: 0.9, cd: 6, when: bankai },
      ],
      // a showboat: the lucky dance before he starts
      opener: () => this.toggle(),
    };
  }

  abilities(): AbilityInfo[] {
    const cd = this.cd;
    const flare = { key: 'V', name: 'Flare', kanji: '霊圧', active: this.flare };
    const lucky = { key: 'G', name: this.luckyT > 0 ? 'Tsuki-Tsuki no Mai (lucky)' : 'Tsuki-Tsuki no Mai', kanji: '舞', cd: cd.dance, cdMax: 18, active: this.luckyT > 0, timer: this.luckyT > 0 ? this.luckyT / 15 : undefined, tint: '#FFD86A' };
    const styptic = { key: 'R', name: `Styptic (${this.stypticLeft})`, kanji: '血止', cd: this.stypticLeft > 0 ? cd.styptic : 8, cdMax: 8, tint: '#C8A97A' };
    if (this.form === 'sealed') {
      return [
        { key: 'LMB', name: 'Sword & sheath', kanji: '剣' },
        { key: 'RMB', name: 'Crossed press', kanji: '押', cost: 6, cd: cd.press, cdMax: 2.6 },
        { key: 'Q', name: 'Hand swap', kanji: '持替', cost: 8, cd: cd.swap, cdMax: 3 },
        { key: 'E', name: 'Headbutt', kanji: '頭突', cost: 4, cd: cd.butt, cdMax: 3 },
        styptic,
        { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
        flare,
        { key: 'F', name: 'Nobiro, Hōzukimaru', kanji: '延', cost: 16, tint: IKKAKU_RED.body },
        lucky,
      ];
    }
    if (this.form === 'shikai') {
      return [
        { key: 'LMB', name: 'Hōzukimaru', kanji: '槍' },
        { key: 'RMB', name: 'Smash', kanji: '砕', cost: 10, cd: cd.smash, cdMax: 3.2 },
        { key: 'Q', name: 'Sakero', kanji: '裂', cost: 12, cd: cd.sakero, cdMax: 3.6, tint: IKKAKU_RED.body },
        { key: 'E', name: 'Hurled segment', kanji: '投', cost: 12, cd: cd.hurl, cdMax: 4 },
        styptic,
        { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
        flare,
        { key: 'F', name: 'Bankai', kanji: '卍解', cost: 40, tint: IKKAKU_RED.body },
        lucky,
      ];
    }
    const full = this.crest >= 1;
    return [
      { key: 'LMB', name: `Ryūmon · crest ${Math.round(this.crest * 100)}%`, kanji: '龍紋', timer: this.crest, active: full, tint: '#FF3B3B' },
      full
        ? { key: 'RMB', name: 'Full-Crest Clash', kanji: '龍紋', cost: 30, cd: cd.xcrash, cdMax: 5, active: true, tint: '#FF3B3B' }
        : { key: 'RMB', name: 'X crash', kanji: '十字', cost: 12, cd: cd.xcrash, cdMax: 3.4 },
      { key: 'Q', name: 'Ryūmon spin', kanji: '旋', cost: 16, cd: cd.spin, cdMax: 5, active: this.spinning },
      { key: 'E', name: 'Chain throw', kanji: '鎖', cost: 14, cd: cd.chain, cdMax: 4.5 },
      { key: 'R', name: 'Centre-blade hurl', kanji: '断', cost: 22, cd: cd.center, cdMax: 6 },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
      flare,
      { key: 'F', name: 'Reiatsu explosion', kanji: '爆', cost: 40, cd: cd.explode, cdMax: 12, tint: IKKAKU_RED.body },
      { key: 'G', name: 'Wake up!', kanji: '起', cost: 6, cd: cd.wake, cdMax: 5, active: this.waking },
    ];
  }
}
