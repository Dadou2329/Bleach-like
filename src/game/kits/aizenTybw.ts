// TYBW Aizen (docs/kits/aizen.md, Thousand-Year Blood War loadout): the Muken prisoner. He starts strapped into the
// chair that confines his reiatsu, the bands over his face; the first thing he does turns a key and the bands over his
// left eye and his mouth fall. Bound: he cannot walk; LMB a glance (invisible blows of pressure), RMB the seated
// Kurohitsugi at full power, Q Raikōhō, E the reiatsu pillar straight up out of the chair, R Kyōka Suigetsu from Muken
// (the foe sees him somewhere else), G the presence that grinds whoever comes near, V the tide of shots crushed by his
// aura. F: the chair bursts apart and the blade comes out of his hand. Unbound: the captain's string and the passing
// stroke, Q Kurohitsugi (full power), E Hadō #99 Goryūtenmetsu, R the substitution, G Bakudō #81 Dankū, V the crushing
// presence. Immortal: the Hōgyoku closes him up the first time, then he only goes down — the third time he stays down.
import * as THREE from 'three';
import { FighterAction, type Fighter, type FighterDef } from '../fighter';
import type { DamageOpts, Game, Projectile } from '../game';
import type { KitAI } from './kit';
import type { AbilityInfo } from '../../ui/hud';
import { AIZEN_DEF, AizenKit, IllusionAction, KidoAction } from './aizen';
import { aizenAsset, aizenProp } from '../../chars/aizen';
import { AIZEN_CLIPS, AIZEN_STANCE } from '../../chars/aizenClips';
import { AIZEN_BOUND_STANCE, AIZEN_TYBW_CLIPS } from '../../chars/aizenTybwClips';
import { BlackCoffin } from '../../vfx/kurohitsugi';
import { MirrorDecoy } from '../../vfx/mirror';
import { ShardBurst } from '../../vfx/shards';
import { LightPillar } from '../../vfx/heilig';
import { CeroBeam } from '../projectiles/cero';
import { shatterModel, type Shattered } from '../../models/shatter';
import { CapsuleShape, SphereShape } from '../../destruction/shapes';
import { TEX_GLOW, TEX_PUFF, TEX_RING, TEX_STREAK } from '../../vfx/sprites';

const VIOLET = '#9B4DFF';
const PALE = '#E9E4FF';
/** his reiatsu range in the chair */
const CAP = 0.7;

export const AIZEN_TYBW_DEF: FighterDef = {
  ...AIZEN_DEF,
  id: 'aizen-tybw',
  title: 'Muken prisoner',
  build: () => ({
    asset: aizenAsset('tybw'),
    props: [
      { key: 'chair', model: aizenProp('chair'), socket: 'chair' },
      { key: 'gag', model: aizenProp('gag'), socket: 'glasses' },
    ],
  }),
  stance: AIZEN_BOUND_STANCE,
  clips: [...AIZEN_CLIPS, ...AIZEN_TYBW_CLIPS],
  hp: 1300,
  rei: 170,
};

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

function sock(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

/** A seated technique: a clip and its events (he does not move). */
class SeatAction extends FighterAction {
  readonly name: string;
  private dur = 1;
  constructor(name: string, readonly clip: string, readonly on: (n: string) => void, armor = 0.4) {
    super();
    this.name = name;
    this.mobility = 0;
    this.armor = armor;
    this.trackTarget = true;
  }
  override start(f: Fighter): void {
    const c = f.anim.clip(this.clip)!;
    this.dur = c.dur - c.fadeOut * 0.5;
    f.anim.play(this.clip, { onEvent: (n) => this.on(n) });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= this.dur) this.done = true;
  }
}

/** Bakudō #81 Dankū: a wall of light before him that stops shots and beams. */
export class DankuWall implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  readonly at = new THREE.Vector3();
  readonly fw = new THREE.Vector3();
  constructor(private g: Game, private owner: Fighter, readonly life = 2.5) {
    owner.forward(this.fw);
    this.at.copy(owner.pos).addScaledVector(this.fw, 1.6);
    this.at.y += 1.6;
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uA: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float uT; uniform float uA; varying vec2 vUv;
        void main() {
          vec2 e = min(vUv, 1.0 - vUv);
          float edge = smoothstep(0.06, 0.0, min(e.x, e.y));
          vec2 g = abs(fract(vUv * vec2(10.0, 7.0)) - 0.5);
          float grid = smoothstep(0.47, 0.5, max(g.x, g.y)) * 0.35;
          float sweep = smoothstep(0.08, 0.0, abs(fract(vUv.y * 0.5 - uT * 0.7) - 0.5));
          float a = (0.12 + edge * 0.9 + grid + sweep * 0.25) * uA;
          gl_FragColor = vec4(mix(vec3(0.75, 0.85, 1.0), vec3(1.0), edge) * 1.4, a);
        }`,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.6), this.mat);
    this.mesh.position.copy(this.at);
    this.mesh.rotation.y = Math.atan2(this.fw.x, this.fw.z);
    this.mesh.renderOrder = 6;
    this.mesh.frustumCulled = false;
    g.engine.gr.scene.add(this.mesh);
  }
  /** a hit from in front of the wall (and behind it from his side) is stopped */
  covers(from: THREE.Vector3): boolean {
    _v.subVectors(from, this.owner.pos).setY(0);
    return _v.lengthSq() > 1 && _v.normalize().dot(this.fw) > 0.35;
  }
  update(dt: number): void {
    this.t += dt;
    if (this.t >= this.life || this.owner.dead) {
      this.done = true;
      return;
    }
    // shots running into it are undone
    const right = _w.set(this.fw.z, 0, -this.fw.x);
    for (const s of [-1.6, 0, 1.6]) this.g.rejectNear(_v.copy(this.at).addScaledVector(right, s), 1.6, this.owner, false);
  }
  render(): void {
    const k = this.t / this.life;
    this.mat.uniforms.uT.value = this.t;
    this.mat.uniforms.uA.value = Math.min(1, this.t * 8) * (k > 0.85 ? (1 - k) / 0.15 : 1);
  }
  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}

export class AizenTybwKit extends AizenKit {
  /** strapped into the chair */
  bound = true;
  /** the first key turned: the bands over the left eye and the mouth are off */
  keyTurned = false;
  /** G while bound: the presence that grinds whoever comes near */
  presence = false;
  /** how many times he has been put down (immortality) */
  downs = 0;
  readonly cd3 = { glance: 0, pillar: 0, tide: 0, danku: 0, presence: 0 };
  private glanceIndex = 0;
  private glanceAt = 0;
  private downT = 0;
  private reviveT = 0;
  private danku: DankuWall | null = null;
  private napeT = 0;
  private chairBroken: Shattered | null = null;
  private presenceTick = 0;
  private illusionUntil = -1;

  constructor(f: Fighter, g: Game) {
    super(f, g);
    this.form = 'tybw';
    f.parry = (amount, from, o) => this.guard(amount, from, o);
    f.onLethal = () => this.lethal();
    this.applyStats();
  }

  // ---------------------------------------------------------------- bits

  private turnKey(): void {
    if (this.keyTurned) return;
    this.keyTurned = true;
    const { f, g } = this;
    const gag = f.visual.props.get('gag');
    if (gag) {
      gag.updateWorldMatrix(true, false);
      const origin = gag.getWorldPosition(new THREE.Vector3());
      const shards = shatterModel(aizenProp('gag'), { pieces: 4, seed: 3, jitter: 0.6 });
      g.addProjectile(new ShardBurst(g, shards.shards, gag.matrixWorld, { origin, dir: f.forward(), speed: 1.4, life: 1.6, dust: '#2A2A2E' }));
      f.visual.detach('gag');
    }
    g.sfx.play('crack', f.center(), 0.6);
    g.callout('鍵', 'THE FIRST KEY TURNS', PALE);
  }

  private banner(text: string): void {
    if (this.f === this.g.player) this.g.hud?.showBanner(text);
  }

  private seat(name: string, clip: string, on: (n: string) => void, cost: number, key: keyof typeof this.cd3 | null, cd: number): boolean {
    const f = this.f;
    if (key && this.cd3[key] > 0) return false;
    if (f.busy || f.hitstun > 0 || f.dead) return false;
    if (!f.spendRei(cost)) {
      this.banner('Not enough reiatsu');
      return false;
    }
    if (key) this.cd3[key] = cd;
    this.turnKey();
    f.act(new SeatAction(name, clip, on), true);
    return true;
  }

  /** the nape barrier, Dankū, and the base finger block */
  private guard(amount: number, from: Fighter | null, o: DamageOpts): boolean {
    const { f, g } = this;
    if (from && this.danku && !this.danku.done && this.danku.covers(from.pos)) {
      g.sparks(this.danku.at, f.forward(_w), PALE, 12);
      g.sfx.play('ting', this.danku.at, 0.8);
      return true;
    }
    // the invisible barrier on the nape: a blow from behind is stopped once every 8 s
    if (from && this.napeT <= 0) {
      _v.subVectors(from.pos, f.pos).setY(0);
      if (_v.lengthSq() > 1e-4 && _v.normalize().dot(f.forward(_w)) < -0.45) {
        this.napeT = 8;
        const p = sock(f, 'back', new THREE.Vector3());
        g.sparks(p, _v.clone(), PALE, 16);
        g.addRing(p.clone(), 1.4, PALE, 0.25);
        g.sfx.play('ting', p, 1.1);
        return true;
      }
    }
    if (this.bound) return false;
    return this.tryParry(amount, from, o);
  }

  /** immortality: the Hōgyoku closes him up once; after that he only goes down — the third time he stays down */
  private lethal(): boolean {
    const { f, g } = this;
    if (this.downs >= 2) return false;
    this.downs++;
    f.hp = 1;
    if (this.downs === 1) {
      this.reviveT = 4;
      f.invuln = Math.max(f.invuln, 4);
      g.callout('崩玉', 'HE CANNOT DIE', PALE);
      f.aura.flare(2, 1.2);
      g.addRing(f.pos.clone(), 10, VIOLET, 0.7);
    } else {
      this.downT = 3;
      f.invuln = Math.max(f.invuln, 3);
      f.stopAction();
      f.hitstun = 3;
      f.anim.play('hit_heavy', { fadeIn: 0.05 });
      g.callout('不死', 'IMMORTAL — FOR NOW', PALE);
    }
    return true;
  }

  override update(dt: number): void {
    super.update(dt);
    const { f, g } = this;
    for (const k of Object.keys(this.cd3) as (keyof typeof this.cd3)[]) this.cd3[k] = Math.max(0, this.cd3[k] - dt);
    this.napeT = Math.max(0, this.napeT - dt);
    if (this.illusionUntil > 0 && g.time >= this.illusionUntil) this.endIllusion();
    if (f.dead) return;
    if (this.bound) f.rooted = true;
    // the Hōgyoku closing him back up
    if (this.reviveT > 0) {
      this.reviveT -= dt;
      f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.1 * dt);
      if (Math.random() < dt * 16) {
        const c = f.center();
        g.engine.glow.spawn({ x: c.x + (Math.random() - 0.5) * 0.6, y: c.y + (Math.random() - 0.5) * 1.2, z: c.z + (Math.random() - 0.5) * 0.6, vx: 0, vy: 0.8, vz: 0, size: 0.14, sizeEnd: 0.02, life: 0.7, r: 0.8, g: 0.65, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
      }
    }
    if (this.downT > 0) {
      this.downT -= dt;
      if (this.downT <= 0) f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.15);
    }
    // the presence grinds whoever comes near
    if (this.presence) {
      if (!f.spendRei(5 * dt)) this.setPresence(false);
      this.presenceTick -= dt;
      if (this.presenceTick <= 0) {
        this.presenceTick = 0.25;
        for (const o of g.enemiesOf(f)) {
          const d = Math.hypot(o.pos.x - f.pos.x, o.pos.z - f.pos.z);
          if (d > 5 + o.def.radius) continue;
          g.damage(o, 7.5, f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 6, quiet: true });
          const c = o.center();
          for (let i = 0; i < 4; i++)
            g.engine.dust.spawn({ x: c.x + (Math.random() - 0.5) * 0.6, y: c.y + (Math.random() - 0.5) * 1.2, z: c.z + (Math.random() - 0.5) * 0.6, vx: 0, vy: 0.4, vz: 0, size: 0.2, sizeEnd: 0.5, life: 0.6, r: 0.6, g: 0.55, b: 0.66, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF });
        }
        const a = Math.random() * Math.PI * 2;
        g.engine.glow.spawn({ x: f.pos.x + Math.cos(a) * 4.5, y: f.pos.y + 0.2, z: f.pos.z + Math.sin(a) * 4.5, vx: -Math.cos(a) * 2, vy: 1.5, vz: -Math.sin(a) * 2, size: 0.18, sizeEnd: 0.03, life: 0.8, r: 0.7, g: 0.5, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
      }
    }
    // the bound body keeps to the chair even through a knock
    if (this.bound) {
      f.push.set(0, 0, 0);
      f.body.vel.x = 0;
      f.body.vel.z = 0;
    }
  }

  protected override applyStats(): void {
    super.applyStats();
    const f = this.f;
    if (this.bound === undefined) return;
    f.power = (this.bound ? 1.1 : 1.75) * (this.flare ? 1.25 : 1);
    f.damageTaken = this.bound ? 0.62 : 0.64;
    f.toughness = this.bound ? 20 : 26;
    f.aura.target = this.presence ? 0.6 : this.flare ? 0.9 : this.bound ? 0.1 : 0.25;
  }

  // ---------------------------------------------------------------- inputs

  override attack(): void {
    if (!this.bound) {
      super.attack();
      return;
    }
    // the glance: a tilt of the head, and the air where he looks breaks
    const { f, g } = this;
    if (f.busy || this.cd3.glance > 0) return;
    if (g.time - this.glanceAt > 1.2) this.glanceIndex = 0;
    this.glanceAt = g.time;
    const i = this.glanceIndex % 4;
    if (this.seat('glance', 'az_glance', (n) => n === 'hit' && this.glanceBlow(i === 3), 0, null, 0)) {
      this.glanceIndex++;
      this.cd3.glance = i === 3 ? 0.9 : 0.4;
    }
  }

  private glanceBlow(big: boolean): void {
    const { f, g } = this;
    const t = this.target();
    if (!t || t.dead) return;
    const d = t.pos.distanceTo(f.pos);
    if (d > 11 * CAP + t.def.radius) return;
    const c = t.center();
    g.damage(t, big ? 30 : 14, f, c.clone().sub(f.center()).setY(0).normalize(), big ? { knock: 12, launch: 3, heavy: true, hitstop: 0.08, shake: 0.3 } : { knock: 3, hitstop: 0.04 });
    g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 0.4, sizeEnd: big ? 3.2 : 2, life: 0.25, r: 0.9, g: 0.85, b: 1, alpha: 0.7, alphaEnd: 0, tex: TEX_RING });
    for (let i = 0; i < (big ? 14 : 6); i++)
      g.engine.dust.spawn({ x: c.x, y: c.y - 0.6, z: c.z, vx: (Math.random() - 0.5) * 6, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 6, size: 0.4, sizeEnd: 1.4, life: 0.5, r: 0.7, g: 0.68, b: 0.72, alpha: 0.45, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    g.sfx.play(big ? 'hitHeavy' : 'hit', c, 0.8);
  }

  override heavy(): void {
    if (!this.bound) {
      super.heavy();
      return;
    }
    // the seated Kurohitsugi at full power
    const { f, g } = this;
    const t = this.target();
    if (this.cd.kuro > 0) return;
    if (this.seat('kurohitsugi', 'az_seat_cast', (n) => {
      if (n === 'charge') {
        f.aura.flare(1.6, 0.9);
        g.sfx.play('charge', f.center(), 0.8);
      }
      if (n !== 'fire') return;
      const tt = t && !t.dead && t.pos.distanceTo(f.pos) < 34 * CAP ? t : null;
      const at = tt ? tt.pos.clone() : f.pos.clone().addScaledVector(f.forward(_v), 8);
      at.y += 1.2 * 1.9;
      g.addProjectile(new BlackCoffin(g, f, tt, at, 200, 1.9, 0.6, 1.5));
      g.callout('破道の九十 黒棺', 'HADŌ #90 — KUROHITSUGI', '#b57dff');
    }, 30, null, 0)) this.cd.kuro = 7;
  }

  override skill1(): void {
    if (!this.bound) {
      super.skill1();
      return;
    }
    // Raikōhō out of the chair: the lightning leaves from his chest
    const { f, g } = this;
    if (this.cd.raikoho > 0) return;
    if (this.seat('raikoho', 'az_seat_cast', (n) => {
      if (n !== 'fire') return;
      const emitter = f.visual.rig.sockets.get('chest.front')!;
      g.addProjectile(new CeroBeam(g, f, emitter, () => {
        const tt = this.target();
        return tt ? tt.center() : f.center().addScaledVector(f.forward(_w), 30);
      }, { charge: 0.12, fire: 0.36, radius: 0.55, damage: 120, power: 380, core: '#FFFBE6', body: '#FFE05A', rim: '#D9A400', range: 85 * CAP, track: 1.4, gain: 1.4 }));
      g.callout('破道の六十三 雷吼炮', 'HADŌ #63 — RAIKŌHŌ', '#ffe066');
    }, 16, null, 0)) this.cd.raikoho = 3;
  }

  override skill2(): void {
    if (!this.bound) {
      // Hadō #99 Goryūtenmetsu
      this.special(new KidoAction(this, 'dragons', this.target()), 50, 'dragons', 12);
      return;
    }
    // the reiatsu pillar: straight up out of the chair, capped by it
    const { f, g } = this;
    this.seat('pillar', 'az_seat_cast', (n) => {
      if (n === 'charge') g.sfx.play('charge', f.center(), 1);
      if (n !== 'fire') return;
      const p = f.pos.clone();
      g.addProjectile(new LightPillar(g, p, 1.6, 60, '#D9C8FF'));
      g.engine.destruction.carve(new CapsuleShape(p.clone().setY(p.y + 3.7), p.clone().setY(p.y + 60), 3.5), { mode: 'smash', power: 1200, impulse: 10, dust: 0.6 });
      for (const o of g.enemiesOf(f)) {
        const d = Math.hypot(o.pos.x - p.x, o.pos.z - p.z);
        if (d > 6 + o.def.radius) continue;
        g.damage(o, 70 * (1 - d / 8), f, o.pos.clone().sub(p).setY(0).normalize(), { knock: 14, launch: 10, heavy: true, hitstop: 0.1, shake: 0.5 });
      }
      g.addRing(p.clone(), 9, VIOLET, 0.6);
      f.aura.pillarBurst(3);
      g.callout('霊圧', 'REIATSU — CAPPED BY THE CHAIR', PALE);
      g.sfx.play('explode', f.center(), 1.2);
      g.shake(0.7);
    }, 30, 'pillar', 9);
  }

  override skill3(): void {
    if (!this.bound) {
      // the substitution: the foe sees a reflection; the real Aizen is behind it
      this.special(new IllusionAction(this, this.target()), 25, 'illusion', 9);
      return;
    }
    // from Muken: the foe sees him somewhere he is not
    const { f, g } = this;
    if (this.cd.illusion > 0 || f.busy) return;
    if (!f.spendRei(25)) {
      this.banner('Not enough reiatsu');
      return;
    }
    this.cd.illusion = 10;
    this.turnKey();
    const decoy = new MirrorDecoy(g, f, 4);
    g.addProjectile(decoy);
    // the copy stands up and walks off to the side: that is where they will look
    const fw = f.forward(new THREE.Vector3());
    const side = new THREE.Vector3(fw.z, 0, -fw.x).multiplyScalar(Math.random() < 0.5 ? 5 : -5);
    decoy.pos.add(side).addScaledVector(fw, 2);
    f.lure = decoy.pos;
    this.hide(true);
    g.callout('鏡花水月', 'KYŌKA SUIGETSU', '#c9b6ff');
    g.sfx.play('shunpo', f.center(), 0.3);
    this.illusionUntil = g.time + 4;
  }

  override toggle(): void {
    if (this.bound) {
      this.setPresence(!this.presence);
      return;
    }
    // Bakudō #81 Dankū
    const { f, g } = this;
    if (this.cd3.danku > 0 || f.dead) return;
    if (!f.spendRei(18)) {
      this.banner('Not enough reiatsu');
      return;
    }
    this.cd3.danku = 8;
    this.danku = new DankuWall(g, f, 2.5);
    g.addProjectile(this.danku);
    g.callout('縛道の八十一 断空', 'BAKUDŌ #81 — DANKŪ', '#cfe0ff');
    g.sfx.play('ting', f.center(), 0.9);
  }

  private setPresence(on: boolean): void {
    const { f, g } = this;
    if (on && this.cd3.presence > 0) return;
    this.presence = on;
    if (!on) this.cd3.presence = 2;
    else {
      this.turnKey();
      f.aura.flare(1.4, 0.5);
      g.addRing(f.pos.clone(), 5, VIOLET, 0.4);
      g.sfx.play('flare', f.center(), 0.8);
    }
    this.applyStats();
  }

  override toggleFlare(): void {
    if (!this.bound) {
      super.toggleFlare();
      return;
    }
    // the tide crushed by his aura: every shot near him gone
    const { f, g } = this;
    if (this.cd3.tide > 0) return;
    if (!f.spendRei(20)) {
      this.banner('Not enough reiatsu');
      return;
    }
    this.cd3.tide = 6;
    this.turnKey();
    const n = g.rejectNear(f.center(), 12, f, true);
    f.aura.flare(2, 0.8);
    g.addRing(f.pos.clone(), 12, VIOLET, 0.5);
    const c = f.center();
    g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 1, sizeEnd: 22, life: 0.4, r: 0.75, g: 0.6, b: 1, alpha: 0.8, alphaEnd: 0, tex: TEX_RING });
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d < 8) {
        o.hitstun = Math.max(o.hitstun, 0.4);
        o.push.addScaledVector(o.pos.clone().sub(f.pos).setY(0).normalize(), 10 * (1 - d / 8));
      }
    }
    g.sfx.play(n > 0 ? 'explode' : 'flare', c, 0.9);
    g.shake(0.3);
  }

  override release(): void {
    const { f, g } = this;
    if (!this.bound || f.busy) return;
    this.turnKey();
    const a = new SeatAction('unbind', 'az_unbind', (n) => {
      if (n === 'burst') this.breakChair();
      if (n === 'rise') {
        this.bound = false;
        f.rooted = false;
        f.def = { ...f.def, stance: AIZEN_STANCE };
        f.anim.loco.stance = AIZEN_STANCE;
      }
      if (n === 'draw') {
        // the blade comes out of his own hand
        f.visual.attach('sword', aizenProp('katana'), 'grip.R');
        f.bladeValid = false;
        const p = sock(f, 'grip.R', new THREE.Vector3());
        for (let i = 0; i < 24; i++)
          g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 3, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 3, size: 0.12, sizeEnd: 0.02, life: 0.5, r: 0.85, g: 0.8, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 1 });
        g.sfx.play('ting', p, 1);
      }
    }, 0);
    a.invulnerable = true;
    f.act(a, true);
  }

  /** the chair bursts apart, the straps fly */
  private breakChair(): void {
    const { f, g } = this;
    this.setPresence(false);
    const chair = f.visual.props.get('chair');
    if (chair) {
      chair.updateWorldMatrix(true, false);
      const origin = chair.getWorldPosition(new THREE.Vector3()).setY(f.pos.y + 0.8);
      this.chairBroken ??= shatterModel(aizenProp('chair'), { pieces: 14, seed: 9, jitter: 0.8 });
      g.addProjectile(new ShardBurst(g, this.chairBroken.shards, chair.matrixWorld, { origin, dir: f.forward().negate(), speed: 7, life: 2.4, dust: '#2B2B30' }));
      f.visual.detach('chair');
    }
    f.aura.pillarBurst(2.6);
    f.aura.flare(2.2, 1.2);
    g.addRing(f.pos.clone(), 16, VIOLET, 0.7);
    g.callout('拘束解除', 'UNBOUND', PALE);
    g.sfx.play('explode', f.center(), 1.3);
    g.sfx.play('bankai', f.center(), 0.8);
    g.shake(0.8);
    g.slowMo(0.4, 0.35);
    g.engine.gr.chroma.offset.set(0.006, 0.006);
    for (const o of g.enemiesOf(f)) {
      const d = o.pos.distanceTo(f.pos);
      if (d < 10) g.damage(o, 25 * (1 - d / 10), f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 18 * (1 - d / 10), launch: 4, heavy: true });
    }
    g.engine.destruction.carve(new SphereShape(f.pos.clone().setY(f.pos.y + 1.1), 1.7), { mode: 'smash', power: 120, impulse: 8, dust: 0.6 });
    this.applyStats();
  }

  /** the Muken illusion ends: he is seen where he sits */
  private endIllusion(): void {
    const f = this.f;
    this.illusionUntil = -1;
    this.hide(false);
    f.lure = null;
  }

  /** an enemy shot (duck-typed: an owner and a position) within r of him */
  private shotsNear(r: number): boolean {
    const f = this.f;
    for (const pj of this.g.projectiles) {
      const q = pj as unknown as { owner?: Fighter; pos?: unknown };
      if (pj.done || !q.owner || q.owner === f || q.owner.team === f.team) continue;
      if (q.pos instanceof THREE.Vector3 && q.pos.distanceTo(f.pos) < r) return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- HUD and AI

  override formName(): string {
    if (this.bound) return this.keyTurned ? 'Muken prisoner — bound' : 'Muken prisoner — sealed';
    return this.downs > 0 ? `Unbound · down ${this.downs}/3` : 'Unbound';
  }

  override abilities(): AbilityInfo[] {
    const c = this.cd3;
    if (this.bound)
      return [
        { key: 'LMB', name: 'A glance', kanji: '視' },
        { key: 'RMB', name: 'Kurohitsugi', kanji: '黒棺', cost: 30, cd: this.cd.kuro, cdMax: 7 },
        { key: 'Q', name: 'Raikōhō', kanji: '雷吼', cost: 16, cd: this.cd.raikoho, cdMax: 3 },
        { key: 'E', name: 'Reiatsu pillar', kanji: '柱', cost: 30, cd: c.pillar, cdMax: 9 },
        { key: 'R', name: 'Kyōka Suigetsu', kanji: '鏡花', cost: 25, cd: this.cd.illusion, cdMax: 10 },
        { key: 'G', name: 'Presence', kanji: '圧', active: this.presence, tint: '#b57dff' },
        { key: 'V', name: 'Crush the tide', kanji: '潰', cost: 20, cd: c.tide, cdMax: 6 },
        { key: 'F', name: 'Unbind', kanji: '解', tint: PALE },
      ];
    return [
      { key: 'LMB', name: 'Kyōka strikes', kanji: '斬' },
      { key: 'RMB', name: 'Passing cut', kanji: '過', cost: 10, cd: this.cd.heavy, cdMax: 3 },
      { key: 'Q', name: 'Kurohitsugi', kanji: '黒棺', cost: 30, cd: this.cd.kuro, cdMax: 7 },
      { key: 'E', name: 'Goryūtenmetsu', kanji: '五龍', cost: 50, cd: this.cd.dragons, cdMax: 12 },
      { key: 'R', name: 'Substitution', kanji: '鏡花', cost: 25, cd: this.cd.illusion, cdMax: 9 },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', cost: 4 },
      { key: 'G', name: 'Dankū', kanji: '断空', cost: 18, cd: c.danku, cdMax: 8 },
      { key: 'V', name: 'Crushing presence', kanji: '霊圧', active: this.flare },
      { key: 'F', name: 'Unbound', kanji: '解', active: true, tint: PALE },
    ];
  }

  override ai(): KitAI {
    const kit = this;
    const bound = () => kit.bound;
    const free = () => !kit.bound;
    const t = () => kit.target();
    const hurt = (k: number) => !!t() && t()!.hp < t()!.maxHp * k;
    return {
      get reach() {
        return kit.bound ? 0.5 : 1.5;
      },
      chain: 3,
      releaseAt: [0.7],
      // he fights from wherever he likes: unbound, half the time he stands off and casts
      ranged: () => kit.bound || Math.random() < 0.45,
      moves: [
        // bound
        { name: 'glance', use: () => kit.attack(), min: 0, max: 7.5, weight: 2.4, cd: 0.6, when: bound },
        { name: 'kuro-seat', use: () => kit.heavy(), min: 3, max: 23, weight: 1.8, cd: 7, when: bound },
        { name: 'raikoho-seat', use: () => kit.skill1(), min: 4, max: 55, weight: 1.6, cd: 3, when: bound },
        { name: 'pillar', use: () => kit.skill2(), min: 0, max: 6, weight: 2.2, cd: 9, when: () => bound() || (!!t() && t()!.pos.y > kit.f.pos.y + 3 && bound()) },
        { name: 'muken', use: () => kit.skill3(), min: 0, max: 30, weight: 1, cd: 12, when: bound },
        { name: 'presence', use: () => kit.toggle(), min: 0, max: 5.5, weight: 6, cd: 4, when: () => bound() && !kit.presence },
        { name: 'presence-off', use: () => kit.toggle(), min: 9, max: 99, weight: 8, cd: 3, when: () => bound() && kit.presence },
        { name: 'tide', use: () => kit.toggleFlare(), min: 0, max: 99, weight: 12, cd: 2, when: () => bound() && kit.shotsNear(14) },
        // unbound
        { name: 'kurohitsugi', use: () => kit.skill1(), min: 0, max: 35, weight: 2.2, cd: 7, when: free },
        { name: 'dragons', use: () => kit.skill2(), min: 3, max: 70, weight: 2, cd: 12, when: () => free() && (hurt(0.75) || kit.f.hp < kit.f.maxHp * 0.5) },
        { name: 'illusion', use: () => kit.skill3(), min: 1, max: 18, weight: 1.6, cd: 9, when: free },
        { name: 'pass', use: () => kit.heavy(), min: 1.5, max: 9, weight: 2, cd: 3.5, when: free },
        { name: 'danku', use: () => kit.toggle(), min: 0, max: 99, weight: 10, cd: 6, when: () => free() && kit.shotsNear(16) },
        { name: 'crush', use: () => kit.toggleFlare(), min: 0, max: 9, weight: 1.2, cd: 14, when: () => free() && !kit.flare },
      ],
    };
  }
}

