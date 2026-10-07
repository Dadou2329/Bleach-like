// Rukia's Kidō and dances. BlueFire: Hadō #33 Sōkatsui (and the doubled #73), a torrent of blue fire shoved
// from the palm. Hainawa: Bakudō #4, a crackling yellow rope flung at the target that coils round its arms
// and torso; Rikujōkōrō: Bakudō #61, six thin bars of light rammed into its middle from six sides.
// Tsukishiro: the first dance — a circle drawn round the target, a pillar of white light, everything inside
// frozen, then shattered together with the ice. ColdWave: the second dance's avalanche of cold air (and
// the Bankai's wave of absolute zero), rolling out in a cone, freezing what it reaches and leaving a
// glacier of ice voxels behind it.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { CapsuleShape, SphereShape } from '../destruction/shapes';
import { raycastVoxels } from '../voxel/raycast';
import { IcePrison, frostWorld, iceSpike, ICE_TINT, type PrisonShape } from './ice';
import { GlassShards } from './mirror';
import { groundAt } from './iceArts';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

/** a random unit vector within `half` radians of d */
function jitterDir(d: THREE.Vector3, half: number, out: THREE.Vector3): THREE.Vector3 {
  const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * Math.tan(half);
  const side = _w.crossVectors(d, Math.abs(d.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : UP).normalize();
  const up = new THREE.Vector3().crossVectors(side, d).normalize();
  return out.copy(d).addScaledVector(side, Math.cos(a) * r).addScaledVector(up, Math.sin(a) * r).normalize();
}

// ------------------------------------------------------------------ Sōkatsui

export interface BlueFireOpts {
  len: number;
  /** cone half-angle (rad) */
  half: number;
  damage: number;
  /** blast radius where it strikes the world */
  blast: number;
  /** the doubled Sōren Sōkatsui: two streams twisting together */
  twin?: boolean;
}

export class BlueFire implements Projectile {
  done = false;
  private t = 0;
  private struck = false;
  readonly dur: number;

  constructor(private g: Game, private owner: Fighter, readonly origin: THREE.Vector3, readonly dir: THREE.Vector3, readonly o: BlueFireOpts) {
    this.dir = dir.clone().normalize();
    this.dur = o.twin ? 0.6 : 0.45;
    g.sfx.play('getsuga', origin, o.twin ? 1.3 : 0.9);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const o = this.o, d = this.dir;
    const speed = o.len / 0.32;
    // the torrent: flames streaming out of the palm, widening into a cone
    if (this.t < this.dur - 0.12) {
      const n = o.twin ? 14 : 9;
      for (let i = 0; i < n; i++) {
        const v = jitterDir(d, o.half * 0.85, _v);
        const s = speed * (0.75 + Math.random() * 0.4);
        const hot = Math.random();
        let x = this.origin.x, y = this.origin.y, z = this.origin.z;
        if (o.twin) {
          // two streams spiralling round each other
          const side = new THREE.Vector3().crossVectors(d, UP).normalize();
          const k = i % 2 ? 1 : -1, ph = this.t * 22;
          x += side.x * k * 0.25 * Math.cos(ph); y += k * 0.25 * Math.sin(ph); z += side.z * k * 0.25 * Math.cos(ph);
        }
        g.engine.glow.spawn({ x, y, z, vx: v.x * s, vy: v.y * s, vz: v.z * s, size: 0.25, sizeEnd: 0.9 + o.len * 0.06, life: 0.3 + Math.random() * 0.12, r: 0.45 + hot * 0.5, g: 0.78 + hot * 0.2, b: 0.95, alpha: 0.85, alphaEnd: 0, tex: TEX_PUFF, drag: 1.5 });
      }
      const v = jitterDir(d, o.half * 0.4, _v);
      g.engine.glow.spawn({ x: this.origin.x, y: this.origin.y, z: this.origin.z, vx: v.x * speed * 1.2, vy: v.y * speed * 1.2, vz: v.z * speed * 1.2, size: 0.2, sizeEnd: 0.05, life: 0.25, r: 0.9, g: 0.98, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 4 });
      g.engine.glow.spawn({ x: this.origin.x, y: this.origin.y, z: this.origin.z, size: 0.6, sizeEnd: 0.9, life: 0.06, r: 0.85, g: 0.97, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
    if (!this.struck && this.t >= 0.07) {
      this.struck = true;
      // everyone in the cone burns
      for (const f of g.enemiesOf(this.owner)) {
        const to = _v.subVectors(f.center(), this.origin);
        const along = to.dot(d);
        if (along < 0 || along > o.len + f.def.radius) continue;
        const across = Math.sqrt(Math.max(0, to.lengthSq() - along * along));
        if (across > Math.tan(o.half) * along + f.def.radius + 0.4) continue;
        g.damage(f, o.damage, this.owner, new THREE.Vector3(d.x, 0, d.z).normalize(), { knock: o.twin ? 18 : 12, launch: o.twin ? 6 : 3, heavy: !!o.twin, hitstop: 0.07, shake: 0.3, color: '#7FC7EC' });
        g.sparks(f.center(), d, '#7FC7EC', 10);
      }
      // and the fire bursts where it meets the world
      const hit = raycastVoxels(g.engine.world, this.origin.x, this.origin.y, this.origin.z, d.x, d.y, d.z, o.len);
      if (hit) {
        const p = this.origin.clone().addScaledVector(d, hit.dist);
        g.engine.destruction.carve(new SphereShape(p, o.blast, 0.9), { mode: 'explode', power: 80 + o.blast * 50, impulse: 8 + o.blast * 3 });
        g.addRing(p.clone(), o.blast * 3, '#7FC7EC', 0.35);
        g.sfx.play('explode', p, Math.min(1.6, 0.5 + o.blast * 0.3));
        for (let i = 0; i < 14; i++) {
          const a = Math.random() * Math.PI * 2;
          g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 6, vy: 2 + Math.random() * 5, vz: Math.sin(a) * 6, size: o.blast * 0.5, sizeEnd: o.blast * 1.2, life: 0.35, r: 0.5, g: 0.82, b: 0.98, alpha: 0.8, alphaEnd: 0, tex: TEX_PUFF, drag: 3 });
        }
      }
    }
    if (this.t >= this.dur + 0.35) this.done = true;
  }

  dispose(): void {}
}

// ------------------------------------------------------------------ Bakudō

const ROPE_N = 40;

/** Bakudō #4 Hainawa: the rope flies, coils round the target, and holds it. */
export class Hainawa implements Projectile {
  done = false;
  bound = false;
  private t = 0;
  private boundAt = 0;
  private tip = new THREE.Vector3();
  private line: THREE.Line;
  private pos = new Float32Array(ROPE_N * 3);

  constructor(private g: Game, private owner: Fighter, private hand: () => THREE.Vector3, readonly target: Fighter, public hold = 1.4) {
    this.tip.copy(hand());
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: new THREE.Color('#FFE45C').multiplyScalar(2), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.line.frustumCulled = false;
    g.engine.gr.scene.add(this.line);
    g.sfx.play('swing', this.tip, 0.8);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const tg = this.target;
    if (!this.bound) {
      const to = _v.subVectors(tg.center(), this.tip);
      const step = 42 * dt;
      if (to.length() < 0.7 && !tg.dead) {
        this.bound = true;
        this.boundAt = this.t;
        g.damage(tg, 10, this.owner, to.setY(0).normalize().clone(), { knock: 0, hitstop: 0.06, shake: 0.2, color: '#FFE45C' });
        g.sfx.play('crack', tg.center(), 0.9);
      } else this.tip.addScaledVector(to.normalize(), Math.min(step, to.length()));
      if (this.t > 0.7) this.done = true;
      return;
    }
    if (!tg.dead) {
      tg.hitstun = Math.max(tg.hitstun, 0.25);
      tg.push.set(0, 0, 0);
      tg.body.vel.x = 0;
      tg.body.vel.z = 0;
    }
    if (this.t - this.boundAt > this.hold || tg.dead) this.done = true;
  }

  render(): void {
    const h = this.hand();
    const tg = this.target;
    const crackle = () => (Math.random() - 0.5) * 0.06;
    if (!this.bound) {
      for (let i = 0; i < ROPE_N; i++) {
        const u = i / (ROPE_N - 1);
        const p = _v.lerpVectors(h, this.tip, u);
        p.y += Math.sin(u * Math.PI) * 0.25;
        this.pos.set([p.x + crackle(), p.y + crackle(), p.z + crackle()], i * 3);
      }
    } else {
      // coiled round the arms and torso; the end back to the hand fades out
      const c = tg.center();
      const r = tg.def.radius + 0.12;
      const tail = Math.max(0, 1 - (this.t - this.boundAt) / 0.35);
      const nTail = tail > 0 ? 8 : 0;
      for (let i = 0; i < ROPE_N; i++) {
        let p: THREE.Vector3;
        if (i < nTail) p = _v.lerpVectors(h, c, i / nTail);
        else {
          const u = (i - nTail) / (ROPE_N - nTail - 1);
          const a = u * Math.PI * 6;
          p = _v.set(c.x + Math.cos(a) * r, c.y + 0.32 - u * 0.62, c.z + Math.sin(a) * r);
        }
        this.pos.set([p.x + crackle(), p.y + crackle(), p.z + crackle()], i * 3);
      }
      if (Math.random() < 0.5) {
        const a = Math.random() * Math.PI * 2;
        this.g.engine.glow.spawn({ x: c.x + Math.cos(a) * r, y: c.y + (Math.random() - 0.5) * 0.6, z: c.z + Math.sin(a) * r, vx: Math.cos(a), vy: Math.random(), vz: Math.sin(a), size: 0.08, sizeEnd: 0.02, life: 0.2, r: 1, g: 0.92, b: 0.45, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
      }
    }
    (this.line.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  dispose(): void {
    this.line.removeFromParent();
    this.line.geometry.dispose();
    (this.line.material as THREE.Material).dispose();
  }
}

let barGeo: THREE.BufferGeometry | null = null;

/** Bakudō #61 Rikujōkōrō: six bars of light slam into the target's middle and lock it in place. */
export class Rikujokoro implements Projectile {
  done = false;
  private t = 0;
  private bars: THREE.Mesh[] = [];
  private mat: THREE.MeshBasicMaterial;
  private hitDone = false;
  private hold = new THREE.Vector3();

  constructor(private g: Game, private owner: Fighter, readonly target: Fighter, readonly dur = 2.4) {
    barGeo ??= new THREE.BoxGeometry(0.07, 0.42, 1.25);
    this.mat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFF2A6').multiplyScalar(2.2), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(barGeo, this.mat);
      m.frustumCulled = false;
      g.engine.gr.scene.add(m);
      this.bars.push(m);
    }
    this.hold.copy(target.pos);
    const c = target.center();
    g.engine.glow.spawn({ x: c.x, y: c.y + 2, z: c.z, size: 0.4, sizeEnd: 1.4, life: 0.25, r: 1, g: 0.95, b: 0.6, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const tg = this.target;
    if (!tg.dead && this.t < this.dur) {
      tg.body.pos.x = this.hold.x;
      tg.body.pos.z = this.hold.z;
      tg.body.vel.set(0, Math.min(0, tg.body.vel.y), 0);
      tg.push.set(0, 0, 0);
      tg.hitstun = Math.max(tg.hitstun, 0.25);
      tg.hovering = false;
    }
    if (!this.hitDone && this.t >= 0.14) {
      this.hitDone = true;
      if (!tg.dead) g.damage(tg, 16, this.owner, new THREE.Vector3(0, 0, 0), { knock: 0, hitstop: 0.1, shake: 0.35, color: '#FFF2A6' });
      g.sfx.play('ting', tg.center(), 1.2);
      g.sfx.play('crack', tg.center(), 0.8);
    }
    if (this.t >= this.dur + 0.25 || (tg.dead && this.t > 0.3)) this.done = true;
  }

  render(): void {
    const tg = this.target;
    const c = tg.center();
    const r = THREE.MathUtils.lerp(3.6, tg.def.radius + 0.05, Math.min(1, this.t / 0.14));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      const m = this.bars[i];
      m.position.set(c.x + Math.cos(a) * (r + 0.55), c.y - 0.05 + (i % 2 ? 0.08 : -0.08), c.z + Math.sin(a) * (r + 0.55));
      m.lookAt(c.x, m.position.y, c.z);
    }
    this.mat.opacity = this.t > this.dur ? Math.max(0, 1 - (this.t - this.dur) / 0.25) : 0.95;
  }

  dispose(): void {
    for (const m of this.bars) m.removeFromParent();
    this.mat.dispose();
  }
}

// ------------------------------------------------------------------ Tsukishiro

const PILLAR_FRAG = /* glsl */ `
uniform float uA; uniform float uTime;
varying vec2 vUv;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  float y = vUv.y;
  float fade = smoothstep(1.0, 0.25, y) * smoothstep(0.0, 0.03, y);
  float stream = h(vec2(floor(vUv.x * 48.0), floor(y * 30.0 - uTime * 18.0)));
  float a = uA * fade * (0.55 + stream * 0.45);
  gl_FragColor = vec4(vec3(0.92, 0.98, 1.0) * 1.6, a);
}`;

/** Some no mai, Tsukishiro: the circle, the pillar of light, the freeze, the shattering. */
export class Tsukishiro implements Projectile {
  done = false;
  private t = 0;
  private ring: THREE.Mesh;
  private pillar: THREE.Mesh;
  private pu = { uA: { value: 0 }, uTime: { value: 0 } };
  private frozen = false;
  private shattered = false;
  private prisons: IcePrison[] = [];

  constructor(private g: Game, private owner: Fighter, readonly center: THREE.Vector3, readonly radius = 2.6, readonly damage = 90) {
    this.ring = new THREE.Mesh(new THREE.RingGeometry(radius - 0.09, radius + 0.09, 64, 1, 0, 0.001), new THREE.MeshBasicMaterial({ color: new THREE.Color('#F5FEFD').multiplyScalar(2), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.copy(center).y += 0.06;
    const pg = new THREE.CylinderGeometry(radius, radius, 34, 48, 1, true);
    pg.translate(0, 17, 0);
    this.pillar = new THREE.Mesh(pg, new THREE.ShaderMaterial({ uniforms: this.pu, vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: PILLAR_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    this.pillar.position.copy(center);
    this.pillar.scale.set(1, 0.001, 1);
    this.ring.frustumCulled = this.pillar.frustumCulled = false;
    this.ring.renderOrder = this.pillar.renderOrder = 6;
    g.engine.gr.scene.add(this.ring, this.pillar);
    g.sfx.play('charge', center, 0.9);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const c = this.center, R = this.radius;
    if (!this.frozen && this.t >= 0.35) {
      this.frozen = true;
      g.sfx.play('crack', c, 1.4);
      frostWorld(g, c.clone().setY(c.y + 0.4), R, 2800);
      for (const f of g.enemiesOf(this.owner)) {
        if (Math.hypot(f.pos.x - c.x, f.pos.z - c.z) > R + f.def.radius || f.pos.y < c.y - 1.5) continue;
        const p = new IcePrison(g, this.owner, f, 1.05, this.damage, 'obelisk', 1);
        this.prisons.push(p);
        g.addProjectile(p);
      }
      for (let i = 0; i < 30; i++) {
        const a = Math.random() * Math.PI * 2, r = Math.random() * R;
        g.engine.glow.spawn({ x: c.x + Math.cos(a) * r, y: c.y + Math.random() * 3, z: c.z + Math.sin(a) * r, vx: 0, vy: 6 + Math.random() * 10, vz: 0, size: 0.12, sizeEnd: 0.03, life: 0.8, r: 0.92, g: 0.99, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
      }
    }
    if (!this.shattered && this.t >= 1.4) {
      this.shattered = true;
      for (const p of this.prisons) p.shatter();
      // whatever stood in the pillar was frozen with it, and breaks with it
      g.engine.destruction.carve(new CapsuleShape(c.clone().setY(c.y + 0.5 + R * 0.5), c.clone().setY(c.y + 9), R * 0.92), { mode: 'smash', power: 150, impulse: 5, dust: 0.2 });
      g.addProjectile(new GlassShards(g, c.clone().setY(c.y + 1.5), new THREE.Vector3(R * 0.7, 1.4, R * 0.7), 70, 4, 1.6, c.y, ICE_TINT, 1.1));
      g.sfx.play('shatter', c, 1.4);
    }
    if (this.t >= 1.85) this.done = true;
  }

  render(dt: number, time: number): void {
    const t = this.t;
    // the circle is drawn round, then fades as the pillar goes up
    const k = Math.min(1, t / 0.3);
    this.ring.geometry.dispose();
    this.ring.geometry = new THREE.RingGeometry(this.radius - 0.09, this.radius + 0.09, 64, 1, -Math.PI / 2, Math.max(0.001, k * Math.PI * 2));
    (this.ring.material as THREE.MeshBasicMaterial).opacity = t < 1.4 ? 0.95 : Math.max(0, 1 - (t - 1.4) / 0.3);
    const rise = Math.min(1, Math.max(0, (t - 0.35) / 0.14));
    this.pillar.scale.y = Math.max(0.001, rise);
    this.pu.uA.value = t < 0.35 ? 0 : t < 1.4 ? 0.85 : Math.max(0, 0.85 - (t - 1.4) * 2.4);
    this.pu.uTime.value = time;
  }

  dispose(): void {
    this.ring.removeFromParent();
    this.ring.geometry.dispose();
    (this.ring.material as THREE.Material).dispose();
    this.pillar.removeFromParent();
    this.pillar.geometry.dispose();
    (this.pillar.material as THREE.Material).dispose();
  }
}

// ------------------------------------------------------------------ the avalanche of cold

export interface ColdWaveOpts {
  len: number;
  /** cone half-angle (rad) */
  half: number;
  speed: number;
  damage: number;
  /** how long the frozen stay frozen (s) */
  freeze: number;
  prison: PrisonShape;
  scale: number;
  /** grow spikes of ice along the ground behind the front */
  spikes: boolean;
}

/** Tsugi no mai, Hakuren (and the Bankai's wave): a cone of cold air rolling out, freezing everything in its path. */
export class ColdWave implements Projectile {
  done = false;
  private t = 0;
  private front = 0;
  private hit = new Set<number>();
  private acc = 0;
  readonly dir: THREE.Vector3;

  constructor(private g: Game, private owner: Fighter, readonly origin: THREE.Vector3, dir: THREE.Vector3, readonly o: ColdWaveOpts) {
    this.dir = dir.clone().setY(Math.max(-0.2, Math.min(0.3, dir.y))).normalize();
    g.sfx.play('beam', origin, 1.1);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const o = this.o, d = this.dir;
    const prev = this.front;
    this.front = Math.min(o.len, this.front + o.speed * dt);
    const side = new THREE.Vector3().crossVectors(d, UP).normalize();
    const wAt = (x: number) => Math.tan(o.half) * x + 0.6;
    if (this.front > prev) {
      // the white front of the avalanche
      const n = Math.ceil(12 * o.scale);
      for (let i = 0; i < n; i++) {
        const x = prev + Math.random() * (this.front - prev);
        const w = wAt(x) * (Math.random() * 2 - 1);
        const p = _v.copy(this.origin).addScaledVector(d, x).addScaledVector(side, w);
        p.y += Math.random() * (0.6 + x * 0.12);
        const v = o.speed * 0.35;
        g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: d.x * v, vy: 0.4 + Math.random() * 1.5, vz: d.z * v, size: 0.8 * o.scale, sizeEnd: (2.4 + x * 0.08) * o.scale, life: 0.9 + Math.random() * 0.5, r: 0.9, g: 0.96, b: 1, alpha: 0.55, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
        if (Math.random() < 0.5) g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: d.x * v, vy: Math.random() * 2, vz: d.z * v, size: 0.07, sizeEnd: 0.02, life: 0.6, r: 0.9, g: 0.98, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
      }
      // everything the front passes freezes
      for (const f of g.enemiesOf(this.owner)) {
        if (this.hit.has(f.id)) continue;
        const to = _w.subVectors(f.pos, this.origin);
        const along = to.dot(d);
        if (along < -0.5 || along > this.front + f.def.radius) continue;
        const across = Math.abs(to.dot(side));
        if (across > wAt(Math.max(0, along)) + f.def.radius) continue;
        if (Math.abs(f.pos.y - (this.origin.y + d.y * along)) > 3 + along * 0.15) continue;
        this.hit.add(f.id);
        g.addProjectile(new IcePrison(g, this.owner, f, o.freeze, o.damage, o.prison, o.scale));
      }
      // and the ground behind it turns to ice
      this.acc += dt;
      if (this.acc > 0.05) {
        this.acc = 0;
        for (let k = 0; k < (o.spikes ? 2 : 1); k++) {
          const x = prev + Math.random() * (this.front - prev);
          const p = _v.copy(this.origin).addScaledVector(d, x).addScaledVector(side, wAt(x) * (Math.random() * 2 - 1) * 0.8);
          const gy = groundAt(g, p.x, p.y + 1, p.z, 6);
          if (gy === null) continue;
          p.y = gy;
          frostWorld(g, p.clone().setY(gy + 0.3), 0.9 + x * 0.04, 500);
          if (o.spikes && Math.random() < 0.7) {
            const dir = new THREE.Vector3().copy(d).multiplyScalar(0.8).add(new THREE.Vector3((Math.random() - 0.5) * 0.6, 0.9 + Math.random() * 0.6, (Math.random() - 0.5) * 0.6));
            iceSpike(g, p.clone().setY(gy - 0.1), dir, (0.9 + Math.random() * 1.2 + x * 0.05) * o.scale, (0.25 + Math.random() * 0.2) * o.scale, 1200);
          }
        }
      }
    }
    if (this.front >= o.len && this.t > o.len / o.speed + 0.4) this.done = true;
  }

  dispose(): void {}
}
