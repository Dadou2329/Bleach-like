// Senbonzakura in play: the petal swarm as a game object. Commands move it between formations —
// orbit around Byakuya, streams that flow from his hilt or hand to a target, Gōkei (a sphere around
// the target that collapses into a blast), Bankai waves that sweep forward, a wall or a dome for
// defence — and every tick the blades shred whatever they pass through: fighters take small cuts and
// the world erodes where the stream meets it, so a held stream tunnels through a building.
import * as THREE from 'three';
import type { Game, Projectile } from '../game';
import type { Fighter } from '../fighter';
import { BoxShape, SphereShape } from '../../destruction/shapes';
import { raycastVoxels } from '../../voxel/raycast';
import { PetalSwarm, bezier } from '../../vfx/petals';
import { TEX_GLOW, TEX_STREAK } from '../../vfx/sprites';

export interface SwarmStrike {
  /** damage per tick (0.1 s) */
  damage: number;
  /** world erosion where the stream meets voxels: [radius, power] */
  carve?: [number, number];
  knock?: number;
}

type Mode = 'orbit' | 'stream' | 'sphere' | 'wave' | 'wall' | 'dome' | 'scatter';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const TICK = 0.1;

export class SenbonzakuraSwarm implements Projectile {
  done = false;
  readonly swarm: PetalSwarm;
  mode: Mode = 'orbit';
  private modeT = 0;
  private dur = 0;
  private tick = 0;
  private strike: SwarmStrike = { damage: 0 };
  private from: () => THREE.Vector3 = () => this.owner.center();
  private target: () => THREE.Vector3 = () => this.owner.center();
  private sideSign = 1;
  private sphereOf: Fighter | null = null;
  private collapsing = 0;
  private wave = { origin: new THREE.Vector3(), dir: new THREE.Vector3(0, 0, 1), width: 8, height: 4, speed: 30, range: 30, depth: 6 };
  private waveHits = new Set<number>();
  /** called when a Gōkei collapses (the kit adds its callout / camera) */
  onCollapse: ((p: THREE.Vector3) => void) | null = null;

  constructor(readonly g: Game, readonly owner: Fighter, count: number, spawn?: (i: number, out: THREE.Vector3) => THREE.Vector3, max = 3600) {
    this.swarm = new PetalSwarm(max);
    g.engine.gr.scene.add(this.swarm.mesh);
    this.orbit();
    this.swarm.setCount(count, spawn);
  }

  // ------------------------------------------------------------------ commands

  orbit(): void {
    this.mode = 'orbit';
    this.swarm.stiffness = 14;
    this.swarm.damping = 4.5;
    const c = this.owner.center();
    this.swarm.formation = { kind: 'orbit', center: c, radius: 1.7, height: 2.2, spin: 0.9 };
  }

  /** A stream from `from()` to `target()` for `dur` seconds. */
  stream(from: () => THREE.Vector3, target: () => THREE.Vector3, dur: number, s: SwarmStrike, radius = 0.8, speed = 1.7): void {
    this.mode = 'stream';
    this.modeT = 0;
    this.dur = dur;
    this.from = from;
    this.target = target;
    this.strike = s;
    this.sideSign = Math.random() < 0.5 ? -1 : 1;
    this.swarm.stiffness = 26;
    this.swarm.damping = 5;
    this.swarm.formation = { kind: 'stream', from: from().clone(), ctrl: new THREE.Vector3(), to: target().clone(), radius, speed };
    this.updateStream();
    this.g.sfx.play('swing', from(), 0.7);
  }

  /** Gōkei: a sphere around the target, attacking from every side, then the collapse. */
  sphere(target: Fighter, dur: number, s: SwarmStrike): void {
    this.mode = 'sphere';
    this.modeT = 0;
    this.dur = dur;
    this.collapsing = 0;
    this.sphereOf = target;
    this.strike = s;
    this.swarm.stiffness = 18;
    this.swarm.damping = 4.2;
    this.swarm.formation = { kind: 'sphere', center: target.center(), radius: 3.2, spin: 2.4 };
  }

  /** A wave front sweeping forward from `origin` along `dir`. */
  sweep(origin: THREE.Vector3, dir: THREE.Vector3, width: number, height: number, speed: number, range: number, s: SwarmStrike): void {
    this.mode = 'wave';
    this.modeT = 0;
    this.dur = range / speed + 0.4;
    this.strike = s;
    this.waveHits.clear();
    Object.assign(this.wave, { origin: origin.clone(), dir: dir.clone().setY(0).normalize(), width, height, speed, range, depth: Math.min(8, width * 0.6) });
    this.swarm.stiffness = 30;
    this.swarm.damping = 5.5;
    this.swarm.formation = { kind: 'wave', origin: this.wave.origin, dir: this.wave.dir, width, height, front: 0, depth: this.wave.depth };
    this.g.sfx.play('getsuga', origin, 0.9);
  }

  /** A wall of blades between Byakuya and the threat. */
  wall(normal: THREE.Vector3, dur: number): void {
    this.mode = 'wall';
    this.modeT = 0;
    this.dur = dur;
    this.swarm.stiffness = 30;
    this.swarm.formation = { kind: 'wall', center: this.owner.center().addScaledVector(normal, 1.6), normal: normal.clone(), width: 4.2, height: 3.2 };
  }

  /** A dome around Byakuya. */
  dome(dur: number): void {
    this.mode = 'dome';
    this.modeT = 0;
    this.dur = dur;
    this.swarm.stiffness = 26;
    this.swarm.formation = { kind: 'dome', center: this.owner.pos.clone(), radius: 3.2 };
  }

  /** The petals return to the blade (or dissolve): fade out and finish. */
  scatter(): void {
    this.mode = 'scatter';
    this.modeT = 0;
    this.dur = 0.8;
  }

  // ------------------------------------------------------------------ loop

  private updateStream(): void {
    const f = this.swarm.formation;
    if (f.kind !== 'stream') return;
    const a = this.from(), b = this.target();
    f.from.copy(a);
    f.to.copy(b);
    // the stream bows sideways and up between hilt and target
    const d = _v.subVectors(b, a);
    const len = d.length();
    const side = _w.set(d.z, 0, -d.x).normalize().multiplyScalar(this.sideSign * Math.min(4, len * 0.22));
    f.ctrl.copy(a).add(b).multiplyScalar(0.5).add(side);
    f.ctrl.y += Math.min(3, len * 0.12);
  }

  update(dt: number, g: Game): void {
    if (this.owner.dead && this.mode !== 'scatter') this.scatter();
    this.modeT += dt;
    this.tick -= dt;
    const doTick = this.tick <= 0;
    if (doTick) this.tick = TICK;
    switch (this.mode) {
      case 'orbit': {
        const f = this.swarm.formation;
        if (f.kind === 'orbit') {
          // the Bankai ocean wheels overhead like a canopy, so he and the camera's view stay clear
          const big = this.swarm.count > 1500;
          f.center.copy(this.owner.center());
          f.center.y += big ? 2.9 : 0;
          f.radius += ((big ? 3.9 : 1.7) - f.radius) * Math.min(1, dt * 2);
          f.height += ((big ? 2.4 : 2.2) - f.height) * Math.min(1, dt * 2);
          f.spin = big ? 0.5 : 0.9;
        }
        break;
      }
      case 'stream': {
        this.updateStream();
        if (doTick) this.streamTick(g);
        if (this.modeT >= this.dur) this.orbit();
        break;
      }
      case 'sphere': {
        const t = this.sphereOf;
        const f = this.swarm.formation;
        if (!t || f.kind !== 'sphere') { this.orbit(); break; }
        if (!t.dead) f.center.copy(t.center());
        if (this.modeT < this.dur) {
          if (doTick && !t.dead) {
            g.damage(t, this.strike.damage, this.owner, _v.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(), { knock: 0.5, quiet: true });
            t.hitstun = Math.max(t.hitstun, 0.25);
            t.push.multiplyScalar(0.2);
          }
        } else {
          // collapse inward, then burst
          this.collapsing += dt;
          f.radius = Math.max(0.25, 3.2 * (1 - this.collapsing / 0.22));
          this.swarm.stiffness = 60;
          if (this.collapsing >= 0.22) this.burst(g, f.center.clone());
        }
        break;
      }
      case 'wave': {
        const f = this.swarm.formation;
        if (f.kind !== 'wave') break;
        f.front = Math.min(this.wave.range, this.modeT * this.wave.speed);
        if (doTick) this.waveTick(g, f.front);
        if (this.modeT >= this.dur) this.orbit();
        break;
      }
      case 'wall':
      case 'dome': {
        const f = this.swarm.formation;
        if (f.kind === 'dome') f.center.copy(this.owner.pos);
        if (f.kind === 'wall') {
          // keep it in front of him, facing the threat
          const n = this.owner.forward(_v);
          f.normal.copy(n);
          f.center.copy(this.owner.center()).addScaledVector(n, 1.6);
        }
        if (this.modeT >= this.dur) this.orbit();
        break;
      }
      case 'scatter': {
        this.swarm.alpha = Math.max(0, 1 - this.modeT / this.dur);
        const f = this.swarm.formation;
        if (f.kind === 'orbit') {
          f.center.copy(this.owner.center());
          f.radius += dt * 3;
        }
        if (this.modeT >= this.dur) this.done = true;
        break;
      }
    }
    this.swarm.update(dt);
  }

  private streamTick(g: Game): void {
    const f = this.swarm.formation;
    if (f.kind !== 'stream') return;
    const s = this.strike;
    // fighters along the leading half of the stream
    for (const o of g.enemiesOf(this.owner)) {
      let hit = false;
      for (const u of [0.5, 0.65, 0.8, 0.92, 1]) {
        bezier(f.from, f.ctrl, f.to, u, _v);
        const cy = Math.max(o.pos.y + 0.2, Math.min(o.pos.y + o.def.height - 0.2, _v.y));
        if (Math.hypot(o.pos.x - _v.x, cy - _v.y, o.pos.z - _v.z) < f.radius + o.def.radius + 0.3) { hit = true; break; }
      }
      if (hit) {
        const dir = _w.subVectors(f.to, f.ctrl).setY(0).normalize();
        g.damage(o, s.damage, this.owner, dir, { knock: s.knock ?? 1.2, quiet: true });
        if (Math.random() < 0.5) g.sparks(o.center(), dir, '#F5A9C4', 5);
      }
    }
    // erosion: where the stream first meets the world (through walls in the way, into the ground behind)
    if (s.carve) {
      const a = f.from, b = f.to;
      const d = _v.subVectors(b, a);
      const len = d.length() + 2.5;
      d.normalize();
      const hit = raycastVoxels(g.engine.world, a.x, a.y, a.z, d.x, d.y, d.z, len);
      if (hit) {
        const p = new THREE.Vector3(a.x + d.x * (hit.dist + 0.3), a.y + d.y * (hit.dist + 0.3), a.z + d.z * (hit.dist + 0.3));
        g.engine.destruction.carve(new SphereShape(p, s.carve[0], 0.9), { mode: 'smash', power: s.carve[1], impulse: 7, dust: 0.45, sparks: [1, 0.66, 0.78] });
      }
    }
  }

  private waveTick(g: Game, front: number): void {
    const w = this.wave;
    const s = this.strike;
    const side = _w.set(w.dir.z, 0, -w.dir.x).normalize();
    for (const o of g.enemiesOf(this.owner)) {
      if (this.waveHits.has(o.id)) continue;
      _v.subVectors(o.pos, w.origin);
      const along = _v.dot(w.dir), across = _v.dot(side);
      if (along < front - w.depth || along > front + 0.8 || Math.abs(across) > w.width / 2 + o.def.radius) continue;
      if (o.pos.y > w.origin.y + w.height + 0.5) continue;
      this.waveHits.add(o.id);
      g.damage(o, s.damage, this.owner, w.dir.clone().setY(0.3).normalize(), { knock: s.knock ?? 14, launch: 6, heavy: true, hitstop: 0.05, shake: 0.4 });
      g.sparks(o.center(), w.dir, '#F5A9C4', 18);
    }
    if (s.carve) {
      // flatten a slab at the front
      const c = w.origin.clone().addScaledVector(w.dir, front - 0.6);
      c.y = w.origin.y + w.height * 0.5;
      _m.makeBasis(side, new THREE.Vector3(0, 1, 0), w.dir);
      _q.setFromRotationMatrix(_m);
      g.engine.destruction.carve(new BoxShape(c, new THREE.Vector3(w.width / 2, w.height / 2 + 0.3, 0.9), _q.clone()), { mode: 'smash', power: s.carve[1], impulse: 10, dust: 0.6, dir: w.dir.clone() });
    }
  }

  private burst(g: Game, p: THREE.Vector3): void {
    this.sphereOf = null;
    g.engine.destruction.carve(new SphereShape(p, 3.4, 0.9), { mode: 'explode', power: 300, impulse: 18 });
    g.sfx.play('explode', p, 1.6);
    g.addRing(p.clone(), 12, '#F5A9C4', 0.6);
    for (const o of g.enemiesOf(this.owner)) {
      const d = o.center().distanceTo(p);
      if (d < 4.5) g.damage(o, (this.strike.damage * 12) * (1 - d / 6), this.owner, o.pos.clone().sub(p).setY(0.4).normalize(), { knock: 18, launch: 8, heavy: true, hitstop: 0.12, shake: 0.8 });
    }
    const glow = g.engine.glow;
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2, e = Math.random() * 2 - 1, q = Math.sqrt(1 - e * e), s = 8 + Math.random() * 16;
      glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * q * s, vy: e * s, vz: Math.sin(a) * q * s, size: 0.18, sizeEnd: 0.03, life: 0.5, r: 1, g: 0.7, b: 0.82, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 2.2 });
    }
    glow.spawn({ x: p.x, y: p.y, z: p.z, size: 3, sizeEnd: 9, life: 0.35, r: 1, g: 0.75, b: 0.85, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    if (g.player && g.player.pos.distanceTo(p) < 60) g.shake(0.7);
    this.onCollapse?.(p);
    this.orbit();
  }

  render(_dt: number, time: number): void {
    this.swarm.render(time);
  }

  dispose(): void {
    this.swarm.dispose();
  }
}
