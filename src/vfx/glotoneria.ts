// Aaroniero Arruruerie's effects (docs/kits/aaroniero.md). The glass capsule of red liquid round his true head (the
// glass and the near liquid are transparent meshes over the voxel heads); Nejibana's water — the rising wave wall and
// the crushing wave behind a pinned target; the red tentacles of Spirit Body Fusion; the Glotonería tentacles that
// slam and sweep; the boil of the pool when the horde comes out; the shatter of a blade that touched his back.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { PropMesh } from '../game/characterFactory';
import type { VoxelModel } from '../models/builder';
import { SphereShape } from '../destruction/shapes';
import { groundAt } from './iceArts';
import { splash, waterMaterial, WaterSpray, type WaterMaterial } from './water';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

export const GLOT_PURPLE = { core: '#C9A0E0', body: '#7A3A9A', rim: '#2E1040' };
export const FUSION_RED = new THREE.Color('#C2263A');

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

/** The glass capsule: a clear shell, red liquid inside, a few bubbles rising; parented to the head prop's socket. */
export class CapsuleGlass {
  readonly group = new THREE.Group();
  private bubbles: THREE.Mesh[] = [];
  private t = 0;
  private mats: THREE.Material[] = [];

  constructor(parent: THREE.Object3D, c: { y: number; r: number; h: number; z?: number }) {
    const liquid = new THREE.MeshBasicMaterial({ color: '#B3142C', transparent: true, opacity: 0.42, depthWrite: false });
    const glass = new THREE.MeshStandardMaterial({ color: '#DCEFF3', transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.1, depthWrite: false });
    const bub = new THREE.MeshBasicMaterial({ color: '#FF8A96', transparent: true, opacity: 0.5, depthWrite: false });
    this.mats.push(liquid, glass, bub);
    // a pill: the walls from the floor up `h`, a domed top; the liquid fills it
    const pill = (r: number, h: number, open: boolean) => {
      const g = new THREE.Group();
      const wall = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 40, 1, open), open ? glass : liquid);
      wall.position.y = h / 2;
      const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 12, 0, Math.PI * 2, 0, Math.PI / 2), open ? glass : liquid);
      dome.scale.y = 0.8;
      dome.position.y = h;
      for (const m of [wall, dome]) {
        m.renderOrder = 6;
        g.add(m);
      }
      g.position.set(0, c.y, c.z ?? -0.02);
      this.group.add(g);
    };
    pill(c.r * 0.94, c.h, false);
    pill(c.r, c.h, true);
    for (let i = 0; i < 6; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.008 + Math.random() * 0.008, 6, 4), bub);
      b.userData.phase = Math.random();
      b.userData.x = (Math.random() - 0.5) * c.r * 1.2;
      b.userData.z = (Math.random() - 0.5) * c.r * 1.2;
      b.renderOrder = 7;
      this.bubbles.push(b);
      this.group.add(b);
    }
    this.group.userData.c = c;
    parent.add(this.group);
  }

  update(dt: number): void {
    this.t += dt;
    const c = this.group.userData.c as { y: number; r: number; h: number; z?: number };
    for (const b of this.bubbles) {
      const u = (this.t * 0.35 + (b.userData.phase as number)) % 1;
      b.position.set(b.userData.x as number, c.y + 0.02 + u * c.h * 1.1, (c.z ?? -0.02) + (b.userData.z as number));
    }
  }

  dispose(): void {
    this.group.removeFromParent();
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    for (const m of this.mats) m.dispose();
  }
}

/**
 * Nejibana's rising wave: a wall of water erupting from the ground across `dir`, rolling a few metres forward; whoever
 * it meets is lifted and carried. `width` across, `height` tall.
 */
export class WaveWall implements Projectile {
  done = false;
  private mesh: THREE.Mesh;
  private mat: WaterMaterial;
  private t = 0;
  private hit = new Set<number>();
  private readonly dir: THREE.Vector3;
  private readonly side: THREE.Vector3;
  private readonly at = new THREE.Vector3();

  constructor(private g: Game, private owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, private width = 8, private height = 3, private dur = 0.9, private damage = 25, private roll = 5) {
    this.dir = dir.clone().setY(0).normalize();
    this.side = new THREE.Vector3(this.dir.z, 0, -this.dir.x);
    const gy = groundAt(g, from.x, from.y + 2, from.z, 6) ?? from.y;
    this.at.set(from.x, gy, from.z);
    this.mat = waterMaterial({ flow: 3, foam: 0.9, scale: 0.7 });
    // a curling sheet: a plane bent forward at the top
    const geo = new THREE.PlaneGeometry(1, 1, 16, 10);
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) + 0.5;
      p.setXYZ(i, p.getX(i), y, Math.sin(y * Math.PI * 0.5) ** 2 * 0.35 - Math.abs(p.getX(i)) * 0.15);
    }
    geo.computeVertexNormals();
    this.mat.side = THREE.DoubleSide;
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
    g.engine.gr.scene.add(this.mesh);
    g.sfx.play('torrent', this.at, 1);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const k = this.t / this.dur;
    const pos = _v.copy(this.at).addScaledVector(this.dir, this.roll * Math.min(1, k * 1.3));
    const h = this.height * Math.sin(Math.min(1, k) * Math.PI);
    // spray along the crest
    const sp = WaterSpray.of(g);
    for (let i = 0; i < 6; i++) {
      const s = (Math.random() - 0.5) * this.width;
      sp.spawn(pos.x + this.side.x * s, pos.y + h, pos.z + this.side.z * s, this.dir.x * 3 + (Math.random() - 0.5) * 2, 1 + Math.random() * 3, this.dir.z * 3 + (Math.random() - 0.5) * 2, 0.06 + Math.random() * 0.06, 0.8, 0.7);
    }
    if (h > 0.5)
      for (const o of g.enemiesOf(this.owner)) {
        if (this.hit.has(o.id)) continue;
        _w.subVectors(o.pos, pos);
        const along = _w.dot(this.dir), across = _w.dot(this.side);
        if (Math.abs(along) > 1.2 + o.def.radius || Math.abs(across) > this.width / 2 + o.def.radius || o.pos.y > pos.y + h) continue;
        this.hit.add(o.id);
        g.damage(o, this.damage, this.owner, this.dir.clone().setY(0.6).normalize(), { energy: true, knock: 10, launch: 10, heavy: true, hitstop: 0.06, shake: 0.35 });
        o.wetT = Math.max(o.wetT, 6);
      }
    if (this.t >= this.dur) {
      this.done = true;
      splash(g, pos.clone().setY(pos.y + 0.3), 2.2, this.dir);
    }
  }

  render(): void {
    const k = this.t / this.dur;
    const pos = _v.copy(this.at).addScaledVector(this.dir, this.roll * Math.min(1, k * 1.3));
    this.mesh.position.copy(pos);
    this.mesh.lookAt(pos.clone().add(this.dir));
    this.mesh.scale.set(this.width, Math.max(0.01, this.height * Math.sin(Math.min(1, k) * Math.PI)), 1);
    this.mat.uniforms.uTime.value = this.t;
    this.mat.uniforms.uAlpha.value = Math.min(1, (this.dur - this.t) * 4);
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}

/** A water arc shed by a swing of the trident (a short splash of droplets along the blade's path). */
export function shedWater(g: Game, from: THREE.Vector3, to: THREE.Vector3, dir: THREE.Vector3, n = 12): void {
  const sp = WaterSpray.of(g);
  for (let i = 0; i < n; i++) {
    const p = _v.lerpVectors(from, to, Math.random());
    sp.spawn(p.x, p.y, p.z, dir.x * (3 + Math.random() * 4) + (Math.random() - 0.5) * 1.5, Math.random() * 2.5, dir.z * (3 + Math.random() * 4) + (Math.random() - 0.5) * 1.5, 0.04 + Math.random() * 0.05, 0.7, 0.6);
  }
}

/**
 * A tentacle out of the mass: a voxel tentacle swung from `from` (its base) over an arc: raised, then brought down on
 * `at` (a slam) or swept round (a sweep). The kit applies the damage at `hitAt`.
 */
export class TentacleStrike implements Projectile {
  done = false;
  private mesh: PropMesh;
  private t = 0;
  private struck = false;

  constructor(private g: Game, model: VoxelModel, private from: () => THREE.Vector3, private at: THREE.Vector3, private kind: 'slam' | 'sweep', private dur = 0.9, readonly hitAt = 0.45, private onHit: () => void = () => {}, private scale = 1) {
    this.mesh = new PropMesh(model);
    this.mesh.frustumCulled = false;
    this.mesh.scale.setScalar(scale);
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number): void {
    this.t += dt;
    if (!this.struck && this.t >= this.hitAt) {
      this.struck = true;
      this.onHit();
    }
    if (this.t >= this.dur) this.done = true;
  }

  render(): void {
    const base = this.from();
    const dir = _v.subVectors(this.at, base).setY(0);
    const yaw = Math.atan2(dir.x, dir.z);
    const u = this.t / this.dur;
    this.mesh.position.copy(base);
    if (this.kind === 'slam') {
      // pitch: raised up and back, then down onto the target
      const k = Math.min(1, this.t / this.hitAt);
      const raise = this.t < this.hitAt ? -Math.PI * 0.42 * Math.sin(Math.min(1, k * 1.6) * Math.PI * 0.5) : 0;
      const pitch = this.t < this.hitAt ? raise + (k > 0.62 ? (k - 0.62) / 0.38 * Math.PI * 0.62 : 0) : Math.PI * 0.2 - (u - this.hitAt / this.dur) * 0.6;
      this.mesh.rotation.set(pitch, yaw, 0, 'YXZ');
    } else {
      // a flat sweep round the base
      const a = yaw - 1.6 + Math.min(1, u * 1.4) * 3.2;
      this.mesh.rotation.set(0.15, a, 0, 'YXZ');
    }
    const fade = Math.min(1, (this.dur - this.t) * 5);
    this.mesh.scale.setScalar(this.scale * Math.max(0.05, Math.min(1, this.t * 6)) * fade);
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.material.dispose();
  }
}

/** Spirit Body Fusion: a red tentacle shot out (a line of red streaks from `from` to `to`). */
export function fusionLash(g: Game, from: THREE.Vector3, to: THREE.Vector3): void {
  const d = _v.subVectors(to, from);
  const len = d.length();
  d.divideScalar(len || 1);
  const n = Math.min(30, Math.ceil(len / 0.4));
  for (let i = 0; i < n; i++) {
    const p = _w.copy(from).addScaledVector(d, (i / n) * len);
    const wob = Math.sin(i * 0.8) * 0.12;
    g.engine.glow.spawn({ x: p.x + wob, y: p.y + wob, z: p.z, vx: d.x * 2, vy: d.y * 2, vz: d.z * 2, size: 0.12, sizeEnd: 0.05, life: 0.25, r: FUSION_RED.r, g: FUSION_RED.g, b: FUSION_RED.b, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
  }
}

/** a blade shattered on his back tentacles: steel shards and a crack */
export function bladeShatter(g: Game, at: THREE.Vector3): void {
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI;
    g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, vx: Math.cos(a) * Math.sin(b) * 7, vy: Math.cos(b) * 5 + 2, vz: Math.sin(a) * Math.sin(b) * 7, size: 0.08, sizeEnd: 0.03, life: 0.6, r: 0.85, g: 0.88, b: 0.92, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2, gravity: -12 });
  }
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: 0.4, sizeEnd: 1.6, life: 0.25, r: 0.8, g: 0.3, b: 0.4, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
  g.sfx.play('shatter', at, 1.2);
}

/** the pool boiling: dark purple bubbles and masks bobbing up (the horde coming out) */
export function poolBoil(g: Game, at: THREE.Vector3, r: number): void {
  for (let i = 0; i < 16; i++) {
    const a = Math.random() * Math.PI * 2, d = Math.random() * r;
    g.engine.dust.spawn({ x: at.x + Math.cos(a) * d, y: at.y, z: at.z + Math.sin(a) * d, vx: 0, vy: 1 + Math.random() * 2, vz: 0, size: 0.3, sizeEnd: 0.8, life: 0.7, r: 0.35, g: 0.12, b: 0.42, alpha: 0.8, alphaEnd: 0, tex: TEX_PUFF, gravity: -3 });
  }
}

/** the true head bared to the light: the borrowed flesh sloughs off in flakes */
export function slough(g: Game, at: THREE.Vector3): void {
  for (let i = 0; i < 22; i++)
    g.engine.dust.spawn({ x: at.x + (Math.random() - 0.5) * 0.3, y: at.y + (Math.random() - 0.3) * 0.3, z: at.z + (Math.random() - 0.5) * 0.3, vx: (Math.random() - 0.5) * 1.5, vy: Math.random() * 1.2, vz: (Math.random() - 0.5) * 1.5, size: 0.06, sizeEnd: 0.12, life: 0.9, r: 0.92, g: 0.76, b: 0.66, alpha: 0.9, alphaEnd: 0, tex: TEX_PUFF, gravity: -6 });
}

/** a crater of the mass's slam */
export function slamCrater(g: Game, at: THREE.Vector3, r: number, power: number): void {
  g.engine.destruction.carve(new SphereShape(at.clone(), r, 0.55), { mode: 'smash', power, impulse: 9, dust: 0.7 });
}
