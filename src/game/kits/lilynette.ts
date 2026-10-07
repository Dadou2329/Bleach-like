// Lilynette Gingerbuck at Starrk's side while he is sealed (docs/roster/E1-espada-1.md): the other half of
// his soul, a brash kid who follows him around, fists on her hips. Sent in (R), she charges whoever he is
// fighting — a flying kick, the horn, her scimitar drawn out of the stump of the snapped horn — or, from
// further off, fires her feeble green Cero out of the masked eye. For the release she comes to stand in
// front of him; he lays his hand on her head and she comes apart in blue reiatsu into the guns.
//
// She is not a fighter (nobody targets her): a character visual with its own animator and kinematic
// body, updated as a projectile. If he dies she goes with him.
import * as THREE from 'three';
import type { Game, Projectile } from '../game';
import type { Fighter } from '../fighter';
import { CharacterVisual } from '../characterFactory';
import { Animator } from '../../anim/animator';
import { KinematicBody } from '../kinematic';
import { LILY_CLIPS, LILY_STANCE } from '../../chars/starrkClips';
import { LILY_BLADE_TIP_Z, lilynetteAsset, starrkProp } from '../../chars/starrk';
import { CeroBeam } from '../projectiles/cero';
import { SwordTrail } from '../../vfx/trail';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from '../../vfx/sprites';
import { angleDelta, damp } from '../../core/math';

type Job = 'follow' | 'kick' | 'head' | 'slash' | 'cero' | 'merge' | 'gone';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const BLUE = new THREE.Color('#6DB6FF');
const GREEN = new THREE.Color('#A8FF8A');

export class Lilynette implements Projectile {
  done = false;
  readonly v: CharacterVisual;
  readonly anim: Animator;
  readonly body: KinematicBody;
  yaw = 0;
  job: Job = 'follow';
  private jobT = 0;
  private phase: 'run' | 'act' = 'run';
  private target: Fighter | null = null;
  private prevVel = new THREE.Vector3();
  private yawRate = 0;
  private renderPos = new THREE.Vector3();
  private fade = 0;
  private fadeDir = 0;
  private stuckT = 0;
  private yellT = 6 + Math.random() * 6;
  private trail: SwordTrail;
  private bladeBase = new THREE.Vector3();
  private bladeTip = new THREE.Vector3();
  private time = 0;

  constructor(private g: Game, readonly owner: Fighter) {
    const a = lilynetteAsset();
    this.v = new CharacterVisual(a.model, a.springs, a.colliders);
    this.v.rig.setBoneVisible('palm.R', false);
    this.v.rig.setBoneVisible('palm.L', false);
    this.anim = new Animator(this.v.rig, LILY_STANCE, this.v.springs);
    this.anim.register(LILY_CLIPS);
    this.body = new KinematicBody(g.engine.world);
    this.body.hw = 0.2;
    this.body.h = 1.36;
    const p = this.spot();
    this.body.pos.copy(p);
    this.body.prev.copy(p);
    this.renderPos.copy(p);
    this.yaw = owner.yaw;
    this.trail = new SwordTrail(20, '#cfe9ff', '#ffffff');
    g.engine.gr.scene.add(this.v.object, this.trail.mesh);
  }

  /** she is around to fight or to merge */
  get present(): boolean {
    return this.job !== 'gone' && this.job !== 'merge' && this.fadeDir >= 0;
  }

  get busy(): boolean {
    return this.job !== 'follow';
  }

  get pos(): THREE.Vector3 {
    return this.body.pos;
  }

  /** her place: at his left shoulder, a step behind */
  private spot(out = new THREE.Vector3()): THREE.Vector3 {
    const o = this.owner;
    const fw = o.forward(_v);
    return out.copy(o.pos).addScaledVector(fw, -0.9).add(_w.set(fw.z, 0, -fw.x).multiplyScalar(1.3));
  }

  // ---------------------------------------------------------------- commands

  /** sent at a target: what she does depends on how far it is */
  command(t: Fighter): boolean {
    if (!this.present || this.busy) return false;
    this.target = t;
    const d = t.pos.distanceTo(this.body.pos);
    const job: Job = d > 9 ? 'cero' : (['kick', 'head', 'slash'] as const)[Math.floor(Math.random() * 3)];
    this.start(job);
    return true;
  }

  private start(job: Job): void {
    this.job = job;
    this.jobT = 0;
    this.phase = 'run';
  }

  yell(): void {
    if (this.present && !this.busy) this.anim.play('ll_yell');
  }

  /** the release: she is in front of him at once (Sonído if she must) and holds still */
  summon(): void {
    if (this.job === 'gone') return;
    this.sheathe();
    this.job = 'merge';
    this.jobT = 0;
    const o = this.owner;
    const fw = o.forward(_v);
    const at = _w.copy(o.pos).addScaledVector(fw, 0.62).add(new THREE.Vector3(fw.z, 0, -fw.x).multiplyScalar(0.12));
    if (at.distanceTo(this.body.pos) > 0.6) this.blink(at);
    this.yaw = o.yaw + Math.PI;
    this.anim.play('ll_merge', { hold: true });
  }

  /** under his hand she comes apart into blue reiatsu */
  dissolveOut(): void {
    if (this.job === 'gone') return;
    this.fadeDir = 1;
    const g = this.g;
    const c = this.center();
    g.sfx.play('flare', c, 0.8);
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * 0.35;
      g.engine.glow.spawn({ x: c.x + Math.cos(a) * r, y: this.body.pos.y + Math.random() * 1.4, z: c.z + Math.sin(a) * r, vx: Math.cos(a) * 1.2, vy: 1 + Math.random() * 2.5, vz: Math.sin(a) * 1.2, size: 0.25 + Math.random() * 0.2, sizeEnd: 0.04, life: 0.7 + Math.random() * 0.5, r: BLUE.r, g: BLUE.g, b: BLUE.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW, drag: 1.5 });
    }
    for (let i = 0; i < 14; i++)
      g.engine.dust.spawn({ x: c.x, y: this.body.pos.y + 0.2 + Math.random() * 1.2, z: c.z, vx: (Math.random() - 0.5) * 3, vy: 0.5 + Math.random() * 1.5, vz: (Math.random() - 0.5) * 3, size: 0.5, sizeEnd: 1.6, life: 1, r: 0.62, g: 0.78, b: 0.95, alpha: 0.35, alphaEnd: 0, tex: TEX_PUFF, drag: 1.5 });
  }

  /** her soul goes with his */
  die(): void {
    if (this.job === 'gone') return;
    this.sheathe();
    this.fadeDir = 1;
  }

  center(out = new THREE.Vector3()): THREE.Vector3 {
    return out.set(this.body.pos.x, this.body.pos.y + 0.75, this.body.pos.z);
  }

  /** a short Sonído: gone, and there */
  private blink(to: THREE.Vector3): void {
    const g = this.g;
    for (const p of [this.center(), to.clone().setY(to.y + 0.75)])
      for (let i = 0; i < 8; i++)
        g.engine.glow.spawn({ x: p.x, y: p.y + (Math.random() - 0.5) * 1.2, z: p.z, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 2, vz: (Math.random() - 0.5) * 3, size: 0.3, sizeEnd: 0.05, life: 0.3, r: BLUE.r, g: BLUE.g, b: BLUE.b, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
    this.body.pos.copy(to);
    this.body.prev.copy(to);
    this.body.vel.set(0, 0, 0);
    this.renderPos.copy(to);
    g.sfx.play('shunpo', to, 0.5);
  }

  private draw(): void {
    if (this.v.props.has('sword')) return;
    this.v.attach('sword', starrkProp('lilyBlade'), 'grip.R');
    this.v.rig.setBoneVisible('palm.R', false);
    const s = this.v.rig.sockets.get('horn');
    if (s) {
      s.getWorldPosition(_v);
      this.g.engine.glow.spawn({ x: _v.x, y: _v.y, z: _v.z, size: 0.6, sizeEnd: 0.1, life: 0.2, r: 1, g: 1, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
    this.g.sfx.play('swing', this.center(), 0.5);
  }

  /** the scimitar falls apart once she is done with it */
  private sheathe(): void {
    const p = this.v.props.get('sword');
    if (!p) return;
    p.getWorldPosition(_v);
    for (let i = 0; i < 10; i++)
      this.g.engine.glow.spawn({ x: _v.x, y: _v.y, z: _v.z, vx: (Math.random() - 0.5) * 2, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 2, size: 0.12, sizeEnd: 0.02, life: 0.5, r: 0.85, g: 0.92, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    this.v.detach('sword');
    this.trail.emitting = false;
  }

  // ---------------------------------------------------------------- simulation

  update(dt: number, g: Game): void {
    const o = this.owner;
    this.time += dt;
    if (!g.fighters.includes(o)) {
      this.done = true;
      return;
    }
    if (o.dead && this.job !== 'gone') this.die();
    if (this.fadeDir > 0) {
      this.fade = Math.min(1, this.fade + dt / 0.55);
      if (this.fade >= 1) {
        this.job = 'gone';
        this.v.object.visible = false;
        this.trail.emitting = false;
      }
    }
    if (this.job === 'gone') return;
    this.jobT += dt;
    const b = this.body;
    let wish = 0;
    let want: THREE.Vector3 | null = null;
    let faceYaw: number | null = null;
    const t = this.target;
    if (this.job !== 'follow' && this.job !== 'merge' && (!t || t.dead || !g.fighters.includes(t) || this.jobT > 6)) {
      this.finish();
    }
    if (this.job === 'follow') {
      want = this.spot(new THREE.Vector3());
      const d = Math.hypot(want.x - b.pos.x, want.z - b.pos.z);
      // left far behind (a Sonído of his): she catches up the same way
      if (d > 16 || (this.stuckT > 1.2 && d > 3)) {
        this.blink(want);
        this.stuckT = 0;
        return;
      }
      wish = d < 0.35 ? 0 : Math.min(d > 5 ? 22 : 8, d * 3);
      if (wish === 0) {
        // at heel: face the way he faces, or what he is fighting
        const foe = o.faceTarget;
        faceYaw = foe ? Math.atan2(foe.x - b.pos.x, foe.z - b.pos.z) : o.yaw;
      }
      this.yellT -= dt;
      if (this.yellT <= 0) {
        this.yellT = 10 + Math.random() * 10;
        if (Math.random() < 0.5) this.yell();
      }
    } else if (this.job === 'merge') {
      faceYaw = o.yaw + Math.PI;
    } else if (t) {
      const reach = this.job === 'cero' ? 8 : this.job === 'slash' ? 1.5 : 1.15;
      const d = Math.hypot(t.pos.x - b.pos.x, t.pos.z - b.pos.z);
      faceYaw = Math.atan2(t.pos.x - b.pos.x, t.pos.z - b.pos.z);
      if (this.phase === 'run') {
        if (d > reach) {
          want = t.pos.clone().addScaledVector(_v.subVectors(b.pos, t.pos).setY(0).normalize(), reach * 0.9);
          wish = 15;
          if (d > 22) {
            this.blink(want);
            return;
          }
        } else this.act(t);
      }
    }
    // movement (her kinematic body): approach the wanted spot
    let vx = 0, vz = 0;
    if (want && wish > 0) {
      _v.subVectors(want, b.pos).setY(0);
      const l = _v.length();
      if (l > 1e-3) {
        vx = (_v.x / l) * wish;
        vz = (_v.z / l) * wish;
      }
    }
    if (this.phase === 'act') {
      vx = 0;
      vz = 0;
    }
    const accel = (b.grounded ? 60 : 20) * dt;
    const dx = vx - b.vel.x, dz = vz - b.vel.z;
    const dl = Math.hypot(dx, dz);
    const k = dl > accel ? accel / dl : 1;
    b.vel.x += dx * k;
    b.vel.z += dz * k;
    // little hops up ledges she can't step
    if (b.hitWall && b.grounded && wish > 0) b.vel.y = 7;
    b.step(dt);
    this.stuckT = b.hitWall && wish > 0 ? this.stuckT + dt : 0;
    // facing
    const sp = Math.hypot(b.vel.x, b.vel.z);
    const oldYaw = this.yaw;
    const yawTo = faceYaw ?? (sp > 0.6 ? Math.atan2(b.vel.x, b.vel.z) : null);
    if (yawTo !== null) this.yaw += angleDelta(this.yaw, yawTo) * (1 - Math.exp(-14 * dt));
    this.yawRate = angleDelta(oldYaw, this.yaw) / Math.max(1e-4, dt);
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    const lx = b.vel.x * cy - b.vel.z * sy, lz = b.vel.x * sy + b.vel.z * cy;
    const fa = ((b.vel.x - this.prevVel.x) * sy + (b.vel.z - this.prevVel.z) * cy) / dt;
    this.prevVel.copy(b.vel);
    this.anim.update(dt, { vx: lx, vz: lz, vy: b.vel.y, grounded: b.grounded, turn: this.yawRate, accel: Math.max(-30, Math.min(30, fa)) });
  }

  /** in reach: do the thing */
  private act(t: Fighter): void {
    this.phase = 'act';
    const g = this.g;
    const done = () => this.finish();
    if (this.job === 'kick' || this.job === 'head') {
      g.sfx.play('swing', this.center(), 0.5);
      this.anim.play(this.job === 'kick' ? 'll_kick' : 'll_head', {
        onEvent: (n) => {
          if (n === 'hop') this.body.vel.y = 4;
          if (n === 'hit') this.strike(t, this.job === 'kick' ? 16 : 20, 1.7);
        },
        onEnd: done,
      });
    } else if (this.job === 'slash') {
      this.anim.play('ll_draw', {
        onEvent: (n) => n === 'draw' && this.draw(),
        onEnd: () => {
          if (this.job !== 'slash') return;
          this.trail.emitting = true;
          this.anim.play('ll_slash', {
            onEvent: (n) => n.startsWith('hit') && this.strike(t, 9, 1.9),
            onEnd: () => {
              this.sheathe();
              done();
            },
          });
        },
      });
    } else if (this.job === 'cero') {
      this.anim.play('ll_cero', {
        onEvent: (n) => {
          if (n !== 'charge') return;
          const face = this.v.rig.sockets.get('face');
          if (!face) return;
          const aim = () => (t.dead ? t.pos.clone() : t.center());
          g.addProjectile(new CeroBeam(g, this.owner, face, aim, { charge: 0.44, fire: 0.3, radius: 0.2, damage: 22, power: 70, core: '#EFFFE6', body: '#A8FF8A', rim: '#3F9E2A', range: 45, track: 2.2, gain: 1.3 }));
          g.callout('虚閃', 'CERO!', '#a8ff8a');
        },
        onEnd: done,
      });
    }
  }

  private strike(t: Fighter, dmg: number, reach: number): void {
    const g = this.g;
    if (t.dead) return;
    const fw = _v.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    _w.subVectors(t.pos, this.body.pos).setY(0);
    const d = _w.length();
    if (d > reach + t.def.radius || _w.normalize().dot(fw) < 0.2 || Math.abs(t.pos.y - this.body.pos.y) > 1.6) return;
    g.damage(t, dmg, this.owner, fw.clone(), { knock: 7, launch: 1.5, hitstop: 0.04, shake: 0.12 });
    g.sparks(t.center(), fw, GREEN);
  }

  private finish(): void {
    this.sheathe();
    this.job = 'follow';
    this.phase = 'run';
    this.target = null;
    this.anim.stopAll(0.25);
  }

  render(dt: number, time: number): void {
    if (this.job === 'gone' && this.fade >= 1) return;
    const b = this.body;
    this.renderPos.x = damp(this.renderPos.x, b.pos.x, 30, dt);
    this.renderPos.y = damp(this.renderPos.y, b.pos.y, 30, dt);
    this.renderPos.z = damp(this.renderPos.z, b.pos.z, 30, dt);
    const o = this.v.object;
    o.position.copy(this.renderPos);
    o.position.y += b.stepOffset;
    o.rotation.y = this.yaw;
    o.updateMatrixWorld(true);
    const t = this.target ?? this.owner;
    this.anim.lookTarget = this.job === 'merge' ? this.owner.center().setY(this.owner.pos.y + 1.7) : t.center();
    this.anim.apply(dt);
    const u = this.v.material.userData.uniforms;
    u.uTime.value = time;
    u.uDissolve.value = this.fade;
    // the release: she glows blue as she goes
    u.uRim.value.set(BLUE.r, BLUE.g, BLUE.b, this.fadeDir > 0 ? 2.5 * this.fade : 0.1);
    for (const p of this.v.props.values()) {
      const pu = p.material.userData.uniforms;
      pu.uTime.value = time;
      pu.uDissolve.value = this.fade;
    }
    const blade = this.v.props.get('sword');
    if (blade) {
      blade.updateMatrixWorld(true);
      this.bladeBase.set(0, 0.01, 0.06).applyMatrix4(blade.matrixWorld);
      this.bladeTip.set(0, 0.03, LILY_BLADE_TIP_Z).applyMatrix4(blade.matrixWorld);
      this.trail.update(dt, this.bladeBase, this.bladeTip);
      if (Math.random() < 0.3) this.g.engine.glow.spawn({ x: this.bladeTip.x, y: this.bladeTip.y, z: this.bladeTip.z, size: 0.1, sizeEnd: 0.02, life: 0.2, r: 0.9, g: 0.95, b: 1, alpha: 0.7, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
    }
  }

  dispose(): void {
    this.v.object.removeFromParent();
    this.trail.mesh.removeFromParent();
  }
}
