// Lesser Hollow: definition + AI. Hunts the nearest enemy, closes in, alternates claw swipes, pounces
// from mid range and roars when it first notices its prey. Dies by purification (dissolve into motes).
import * as THREE from 'three';
import { FighterAction, type Fighter, type FighterDef } from '../fighter';
import type { Controller, Game } from '../game';
import { buildHollow, HOLLOW_CLIPS, HOLLOW_STANCE } from '../../chars/hollow';
import { TEX_PUFF } from '../../vfx/sprites';
import { SphereShape } from '../../destruction/shapes';

export function hollowDef(seed: number, size = 1): FighterDef {
  return {
    id: 'hollow',
    name: 'Hollow',
    build: () => ({ asset: buildHollow({ seed, size }), props: [] }),
    stance: HOLLOW_STANCE,
    clips: HOLLOW_CLIPS,
    aura: { core: '#FFD0D0', body: '#B3122E', rim: '#5A0A14' },
    hp: Math.round(160 * size * size),
    rei: 50,
    speed: { run: 7, sprint: 10, jump: 9, dash: 8, dashTime: 0.2 },
    radius: 0.62 * size,
    height: 2.45 * size,
  };
}

const _d = new THREE.Vector3();

class ClawAction extends FighterAction {
  readonly name: string;
  constructor(readonly clip: string, readonly dmg: number, readonly reach: number) {
    super();
    this.name = clip;
    this.mobility = 0.15;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play(this.clip, {
      onEvent: (n) => {
        if (n === 'step') f.push.addScaledVector(f.forward(), 5);
        if (n === 'hit') this.strike(f, g);
        if (n === 'step') g.sfx.play('swing', f.center(), 0.7);
      },
    });
  }
  private strike(f: Fighter, g: Game): void {
    const fw = f.forward();
    for (const o of g.enemiesOf(f)) {
      _d.subVectors(o.pos, f.pos);
      const dy = Math.abs(_d.y);
      _d.y = 0;
      const d = _d.length();
      if (d > this.reach + o.def.radius || dy > f.def.height) continue;
      if (d > 0.3 && _d.normalize().dot(fw) < 0.2) continue;
      g.damage(o, this.dmg, f, _d.lengthSq() > 0 ? _d : fw, { knock: 7, launch: 2, hitstop: 0.06, shake: 0.3 });
      g.sparks(o.center(), _d, '#ff6a6a', 10);
    }
    // claws gouge whatever is in front
    const p = f.center().addScaledVector(fw, this.reach * 0.8);
    g.engine.destruction.carve(new SphereShape(p, 0.75), { mode: 'smash', power: 26, impulse: 5, dust: 0.5 });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= f.anim.clip(this.clip)!.dur - 0.12) this.done = true;
  }
}

class PounceAction extends FighterAction {
  readonly name = 'pounce';
  constructor() {
    super();
    this.mobility = 0;
    this.airGravity = 1;
  }
  override start(f: Fighter, g: Game): void {
    f.anim.play('pounce', {
      onEvent: (n) => {
        if (n === 'leap') {
          f.push.addScaledVector(f.forward(), 13);
          f.body.vel.y = 7.5;
        }
        if (n === 'hit') {
          const p = f.pos.clone().addScaledVector(f.forward(), 1.2);
          for (const o of g.enemiesOf(f)) {
            const d = o.pos.distanceTo(p);
            if (d < 2.4 + o.def.radius) g.damage(o, 55, f, o.pos.clone().sub(f.pos).setY(0).normalize(), { knock: 10, launch: 4, heavy: true, hitstop: 0.08, shake: 0.45 });
          }
          if (f.grounded) g.groundImpact(f.pos.clone().addScaledVector(f.forward(), 1.4), 0.9, 40, '#B3122E');
        }
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 1.0) this.done = true;
  }
}

class RoarAction extends FighterAction {
  readonly name = 'roar';
  override start(f: Fighter, g: Game): void {
    f.anim.play('roar', {
      onEvent: (n) => {
        if (n !== 'roar') return;
        g.sfx.play('roar', f.center());
        if (g.player && f.pos.distanceTo(g.player.pos) < 30) g.shake(0.25);
        const p = f.pos;
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * Math.PI * 2;
          g.engine.dust.spawn({ x: p.x, y: p.y + 0.2, z: p.z, vx: Math.cos(a) * 6, vy: 0.5, vz: Math.sin(a) * 6, size: 0.5, sizeEnd: 1.8, life: 0.8, r: 0.6, g: 0.56, b: 0.5, alpha: 0.45, alphaEnd: 0, tex: TEX_PUFF, drag: 2.5 });
        }
        g.addRing(p.clone(), 6, '#B3122E', 0.6);
      },
    });
  }
  override update(f: Fighter, g: Game, dt: number): void {
    super.update(f, g, dt);
    if (this.t >= 1.25) this.done = true;
  }
}

export class HollowAI implements Controller {
  private cd = 1 + Math.random();
  private noticed = false;
  private strafe = Math.random() < 0.5 ? 1 : -1;
  private strafeT = 0;
  private wanderT = 0;
  private wanderDir = new THREE.Vector3(1, 0, 0);
  private alt = false;

  constructor(readonly g: Game, readonly f: Fighter) {}

  update(dt: number): void {
    const { g, f } = this;
    if (f.dead) {
      f.wish.set(0, 0, 0);
      return;
    }
    this.cd -= dt;
    this.strafeT -= dt;
    const target = g.nearestEnemy(f, 60);
    if (!target) {
      // wander
      this.wanderT -= dt;
      if (this.wanderT <= 0) {
        this.wanderT = 2 + Math.random() * 3;
        const a = Math.random() * Math.PI * 2;
        this.wanderDir.set(Math.cos(a), 0, Math.sin(a));
      }
      f.wish.copy(this.wanderDir).multiplyScalar(0.35);
      f.faceTarget = null;
      return;
    }
    _d.subVectors(target.pos, f.pos);
    const dist = Math.hypot(_d.x, _d.z);
    _d.y = 0;
    _d.normalize();
    f.faceTarget = target.center();
    if (!this.noticed && dist < 35) {
      this.noticed = true;
      if (!f.busy) f.act(new RoarAction());
      return;
    }
    if (f.busy) {
      f.wish.set(0, 0, 0);
      return;
    }
    const reach = 2.0 + f.def.radius;
    if (dist > reach) {
      if (this.strafeT <= 0) {
        this.strafeT = 1.5 + Math.random() * 2;
        this.strafe = -this.strafe;
      }
      const side = new THREE.Vector3(-_d.z, 0, _d.x).multiplyScalar(this.strafe * (dist < 9 ? 0.45 : 0.15));
      f.wish.copy(_d).add(side).normalize();
      f.wishSprint = dist > 14;
      f.sprinting = f.wishSprint;
    } else f.wish.set(0, 0, 0);
    if (this.cd <= 0) {
      if (dist <= reach + 0.4) {
        this.alt = !this.alt;
        f.act(new ClawAction(this.alt ? 'claw1' : 'claw2', 38, reach));
        this.cd = 1.1 + Math.random() * 0.9;
      } else if (dist > 5.5 && dist < 11 && Math.random() < 0.35 && f.grounded) {
        f.act(new PounceAction());
        this.cd = 3 + Math.random() * 2;
      } else this.cd = 0.3;
    }
  }
}
