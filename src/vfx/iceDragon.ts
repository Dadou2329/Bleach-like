// Hyōrinmaru's ice dragon: a serpent of water and ice pours from the blade and flies at the target,
// weaving as it comes. The voxel head leads; the body is a chain of hexagonal ice scales trailing the
// path the head flew, a crest of spikes along its back, mist and glittering frost shed behind it.
// Whatever it strikes freezes solid; the ground and walls round the impact are crusted with real ice.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { PropMesh } from '../game/characterFactory';
import { hitsugayaProp } from '../chars/hitsugaya';
import { SphereShape } from '../destruction/shapes';
import { IcePrison, crystalGeometry, crystalMaterial, frostWorld, ICE_TINT } from './ice';
import { GlassShards } from './mirror';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

const SEGS = 34;
const HIST = 160;

export interface IceDragonOpts {
  speed?: number;
  damage?: number;
  scale?: number;
  /** seconds before it gives up and bursts where it is */
  life?: number;
  /** homing turn rate (rad/s) */
  turn?: number;
  /** freeze time on a hit */
  freeze?: number;
}

const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const _s = new THREE.Vector3();
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

export class IceDragon implements Projectile {
  done = false;
  private t = 0;
  private head: PropMesh;
  private body: THREE.InstancedMesh;
  private crest: THREE.InstancedMesh;
  private mat = crystalMaterial(0.92, 1.1);
  private hist: THREE.Vector3[] = [];
  private pos: THREE.Vector3;
  private vel: THREE.Vector3;
  private struck = -1;
  private light: THREE.PointLight;
  private o: Required<IceDragonOpts>;
  private phase = Math.random() * 6;

  constructor(private g: Game, private owner: Fighter, origin: THREE.Vector3, dir: THREE.Vector3, private target: () => Fighter | null, o: IceDragonOpts = {}) {
    this.o = { speed: 26, damage: 70, scale: 1, life: 2.4, turn: 3.2, freeze: 1.4, ...o };
    this.pos = origin.clone();
    this.vel = dir.clone().normalize().multiplyScalar(this.o.speed);
    for (let i = 0; i < HIST; i++) this.hist.push(origin.clone());
    this.head = new PropMesh(hitsugayaProp('dragon-head'));
    this.head.scale.setScalar(this.o.scale * 1.3);
    this.head.renderOrder = 5;
    const geo = crystalGeometry();
    this.body = new THREE.InstancedMesh(geo, this.mat, SEGS);
    this.crest = new THREE.InstancedMesh(geo, this.mat, Math.ceil(SEGS / 3));
    for (const m of [this.body, this.crest]) {
      m.frustumCulled = false;
      m.renderOrder = 5;
    }
    this.light = new THREE.PointLight('#9FDDF5', 30, 14 * this.o.scale, 1.6);
    g.engine.gr.scene.add(this.head, this.body, this.crest, this.light);
    g.sfx.play('roar', origin, 0.9);
    g.sfx.play('getsuga', origin, 0.6);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.struck >= 0) {
      if (this.t - this.struck > 0.35) this.done = true;
      return;
    }
    const sc = this.o.scale;
    // steer toward the target, weaving like a serpent
    const tgt = this.target();
    if (tgt && !tgt.dead) {
      const want = _v.subVectors(tgt.center(), this.pos).normalize().multiplyScalar(this.o.speed);
      const cur = _w.copy(this.vel);
      const ang = cur.angleTo(want);
      const k = Math.min(1, (this.o.turn * dt) / Math.max(1e-4, ang));
      this.vel.lerp(want, k).setLength(this.o.speed);
    }
    const side = _w.crossVectors(this.vel, UP);
    if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
    side.normalize();
    const weave = Math.sin(this.t * 9 + this.phase) * 6 * sc;
    this.pos.addScaledVector(this.vel, dt).addScaledVector(side, weave * dt);
    this.pos.y += Math.cos(this.t * 7 + this.phase) * 2.5 * sc * dt;
    this.hist.unshift(this.pos.clone());
    this.hist.length = HIST;
    // mist and frost shed behind
    const e = g.engine;
    if (Math.random() < 0.8) e.dust.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, vz: (Math.random() - 0.5) * 2, size: 0.5 * sc, sizeEnd: 1.8 * sc, life: 0.7, r: 0.86, g: 0.95, b: 1, alpha: 0.4, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    for (let i = 0; i < 2; i++) {
      const p = this.hist[Math.floor(Math.random() * 60)];
      e.glow.spawn({ x: p.x + (Math.random() - 0.5) * sc, y: p.y + (Math.random() - 0.5) * sc, z: p.z + (Math.random() - 0.5) * sc, vx: 0, vy: -1.5, vz: 0, size: 0.07, sizeEnd: 0.02, life: 0.6, r: 0.85, g: 0.97, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    }
    // what it touches freezes
    for (const f of g.enemiesOf(this.owner)) {
      if (f.center().distanceTo(this.pos) < (0.9 + f.def.radius) * sc) {
        this.strike(f);
        return;
      }
    }
    const vs = e.world.vs;
    if (e.world.isSolid(Math.floor(this.pos.x / vs), Math.floor(this.pos.y / vs), Math.floor(this.pos.z / vs)) || this.t > this.o.life) this.strike(null);
  }

  private strike(f: Fighter | null): void {
    const g = this.g, sc = this.o.scale;
    this.struck = this.t;
    const p = this.pos.clone();
    if (f) {
      g.damage(f, this.o.damage * 0.4, this.owner, this.vel.clone().normalize(), { knock: 6, heavy: true, hitstop: 0.08, shake: 0.4 });
      if (!f.dead) g.addProjectile(new IcePrison(g, this.owner, f, this.o.freeze, this.o.damage * 0.6, 'block', 1));
    }
    g.engine.destruction.carve(new SphereShape(p, 1.1 * sc, 0.8), { mode: 'smash', power: 110 * sc, impulse: 8, dust: 0.4 });
    frostWorld(g, p, 2.6 * sc);
    // the body bursts into ice along its length
    for (let i = 0; i < 4; i++) {
      const q = this.hist[Math.min(HIST - 1, i * 18)];
      g.addProjectile(new GlassShards(g, q, new THREE.Vector3(0.4 * sc, 0.4 * sc, 0.4 * sc), 18, 4, 1.4, q.y - 3, ICE_TINT, sc));
    }
    g.addRing(p.clone(), 5 * sc, '#BFEFFF', 0.45);
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2, el = Math.random() * 2 - 1, k = Math.sqrt(1 - el * el), s = 4 + Math.random() * 8;
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * k * s, vy: el * s, vz: Math.sin(a) * k * s, size: 0.14, sizeEnd: 0.02, life: 0.5, r: 0.85, g: 0.97, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 2 });
    }
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 6, vy: Math.random() * 3, vz: Math.sin(a) * 6, size: 0.8 * sc, sizeEnd: 2.8 * sc, life: 1, r: 0.88, g: 0.95, b: 1, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    }
    g.sfx.play('shatter', p, 1.2);
    g.sfx.play('impact', p, 0.8);
    g.shake(0.35);
  }

  render(): void {
    const sc = this.o.scale;
    const fade = this.struck >= 0 ? Math.max(0, 1 - (this.t - this.struck) / 0.25) : 1;
    const grow = Math.min(1, this.t / 0.15);
    // head: at the front of the path, looking along it
    this.head.position.copy(this.pos);
    this.head.lookAt(_v.copy(this.pos).add(this.vel));
    this.head.visible = fade > 0.05;
    this.head.scale.setScalar(sc * 1.3 * grow * (0.6 + 0.4 * fade));
    // body scales: pointing back along the path, largest behind the head
    let c = 0;
    for (let i = 0; i < SEGS; i++) {
      const a = this.hist[Math.min(HIST - 1, 2 + i * 4)];
      const b = this.hist[Math.min(HIST - 1, 2 + i * 4 + 3)];
      const dir = _v.subVectors(b, a);
      if (dir.lengthSq() < 1e-6) dir.set(0, 0, -1);
      dir.normalize();
      _q.setFromUnitVectors(UP, dir);
      const k = 1 - i / SEGS;
      const r = (0.32 + 0.58 * Math.pow(k, 0.8)) * sc * grow * fade * (1 + Math.sin(this.t * 12 + i * 0.8) * 0.06);
      _s.set(r * 2.1, r * 3.2, r * 2.1);
      _m.compose(a, _q, _s);
      this.body.setMatrixAt(i, _m);
      if (i % 3 === 0 && c < this.crest.count) {
        // a spine on the back, leaning back
        const up = _w.set(0, 1, 0).addScaledVector(dir, 0.9).normalize();
        _q.setFromUnitVectors(UP, up);
        _s.set(r * 0.9, r * 2.4, r * 0.9);
        _m.compose(_v.copy(a).add(new THREE.Vector3(0, r * 0.7, 0)), _q, _s);
        this.crest.setMatrixAt(c++, _m);
      }
    }
    this.body.instanceMatrix.needsUpdate = true;
    this.crest.instanceMatrix.needsUpdate = true;
    this.mat.uniforms.uA.value = fade;
    this.light.position.copy(this.pos);
    this.light.intensity = 30 * fade;
  }

  dispose(): void {
    this.head.removeFromParent();
    this.head.material.dispose();
    this.body.removeFromParent();
    this.crest.removeFromParent();
    this.mat.dispose();
    this.light.removeFromParent();
  }
}
