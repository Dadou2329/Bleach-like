// Suì-Fēng's arts. The Hōmonka: the black hornet crest a first sting leaves on the body — a second sting
// on the same crest is death: a bigger crest blooms out of it and the body comes apart. Shunkō: her
// element is wind — Kidō compressed over the back and arms, gusting round her, bursting out of every blow.
// Jakuhō Raikōben: the gold missile, twice her height, fins snapping out, homing, and then the explosion.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import type { VoxelModel } from '../models/builder';
import { PropMesh } from '../game/characterFactory';
import { SphereShape } from '../destruction/shapes';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

// ------------------------------------------------------------------ the Hōmonka

let crestTex: THREE.Texture | null = null;

/** The crest: a black hornet-butterfly — two pairs of wings round a small body, drawn once to a canvas. */
function crestTexture(): THREE.Texture {
  if (crestTex) return crestTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d')!;
  x.translate(64, 64);
  x.fillStyle = '#141418';
  x.strokeStyle = 'rgba(122, 62, 140, 0.9)';
  x.lineWidth = 3;
  const wing = (a: number, len: number, w: number) => {
    x.save();
    x.rotate(a);
    x.beginPath();
    x.moveTo(0, 0);
    x.bezierCurveTo(w, -len * 0.35, w * 0.9, -len, 0, -len);
    x.bezierCurveTo(-w * 0.9, -len, -w, -len * 0.35, 0, 0);
    x.fill();
    x.stroke();
    x.restore();
  };
  for (const s of [-1, 1]) {
    wing(s * 0.75, 56, 22);
    wing(s * 2.2, 40, 16);
  }
  x.beginPath();
  x.ellipse(0, 0, 7, 16, 0, 0, Math.PI * 2);
  x.fill();
  crestTex = new THREE.CanvasTexture(c);
  crestTex.colorSpace = THREE.SRGBColorSpace;
  return crestTex;
}

export type CrestRegion = 'high' | 'mid' | 'low';

/** A crest on a body: a decal bound to the nearest bone, facing out of the body at the hit point. */
export class Homonka {
  readonly mesh: THREE.Mesh;
  readonly born: number;
  private bloomT = -1;
  private mat: THREE.MeshBasicMaterial;

  constructor(readonly target: Fighter, readonly region: CrestRegion, now: number, size = 0.22) {
    this.born = now;
    this.mat = new THREE.MeshBasicMaterial({ map: crestTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, side: THREE.DoubleSide, opacity: 0.95 });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), this.mat);
    const rig = target.visual.rig;
    const boneName = region === 'high' ? 'head' : region === 'mid' ? 'chest' : 'thigh.R';
    const bi = rig.index(boneName);
    const bone = bi >= 0 ? rig.bones[bi] : rig.bones[0];
    bone.updateWorldMatrix(true, false);
    // a point on the front of the body at the region's height
    const h = target.def.height;
    const y = target.pos.y + h * (region === 'high' ? 0.86 : region === 'mid' ? 0.6 : 0.3);
    const fw = target.forward(_w);
    const world = new THREE.Vector3(target.pos.x + fw.x * target.def.radius * 0.75, y, target.pos.z + fw.z * target.def.radius * 0.75);
    world.x += (Math.random() - 0.5) * 0.1;
    world.y += (Math.random() - 0.5) * 0.08;
    bone.add(this.mesh);
    this.mesh.position.copy(bone.worldToLocal(world.clone()));
    // face out of the body
    const out = world.clone().add(fw);
    this.mesh.lookAt(out);
    this.mesh.rotateZ((Math.random() - 0.5) * 0.6);
    this.mesh.renderOrder = 5;
  }

  /** the second sting: the crest blooms (the kit applies the death) */
  bloom(): void {
    this.bloomT = 0;
  }

  /** returns false once the crest is gone */
  update(dt: number): boolean {
    if (this.bloomT < 0) return true;
    this.bloomT += dt;
    const k = this.bloomT;
    this.mesh.scale.setScalar(1 + k * 9);
    this.mat.opacity = Math.max(0, 0.95 - k * 1.6);
    if (k > 0.6) {
      this.dispose();
      return false;
    }
    return true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}

/** The body coming apart round a bloomed crest: black petals and dark dust thrown off. */
export function crestDeath(g: Game, p: THREE.Vector3): void {
  for (let i = 0; i < 60; i++) {
    _v.set(Math.random() - 0.5, Math.random() - 0.2, Math.random() - 0.5).normalize().multiplyScalar(2 + Math.random() * 5);
    g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: _v.x, vy: _v.y, vz: _v.z, size: 0.18, sizeEnd: 0.5, life: 0.8 + Math.random() * 0.5, r: 0.08, g: 0.06, b: 0.1, alpha: 0.85, alphaEnd: 0, tex: TEX_PUFF, drag: 2.5 });
  }
  for (let i = 0; i < 20; i++) g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 7, vy: (Math.random() - 0.3) * 7, vz: (Math.random() - 0.5) * 7, size: 0.08, sizeEnd: 0.02, life: 0.4, r: 0.48, g: 0.24, b: 0.55, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2.5, drag: 3 });
  g.sfx.play('crack', p, 1.2);
}

// ------------------------------------------------------------------ Shunkō: the wind

/** Gusts streaming round her back and arms (called every step while Shunkō holds). */
export function windShunko(g: Game, f: Fighter, level: number): void {
  const c = f.center();
  const fw = f.forward(_v);
  const n = Math.round(3 * level);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 0.45 + Math.random() * 0.35;
    const y = c.y + (Math.random() - 0.3) * 0.9;
    const x = c.x + Math.cos(a) * r - fw.x * 0.15, z = c.z + Math.sin(a) * r - fw.z * 0.15;
    // tangential: the wind orbits her
    const tx = -Math.sin(a) * 5, tz = Math.cos(a) * 5;
    const white = Math.random() < 0.5;
    g.engine.glow.spawn({ x, y, z, vx: tx, vy: 1.2 + Math.random() * 1.5, vz: tz, size: 0.12, sizeEnd: 0.04, life: 0.28, r: white ? 0.93 : 0.66, g: white ? 0.96 : 0.81, b: 1, alpha: 0.7, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 1.5 });
  }
  if (Math.random() < 0.25 * level) g.engine.dust.spawn({ x: c.x, y: f.pos.y + 0.1, z: c.z, vx: (Math.random() - 0.5) * 3, vy: 0.4, vz: (Math.random() - 0.5) * 3, size: 0.4, sizeEnd: 1.4, life: 0.6, r: 0.85, g: 0.9, b: 0.95, alpha: 0.25, alphaEnd: 0, tex: TEX_PUFF });
}

/** A blow loaded with Shunkō: the wind bursts out ahead of the fist. */
export function windBurst(g: Game, p: THREE.Vector3, dir: THREE.Vector3, k = 1): void {
  for (let i = 0; i < 16 * k; i++) {
    _v.copy(dir).multiplyScalar(6 + Math.random() * 8);
    _v.x += (Math.random() - 0.5) * 6;
    _v.y += (Math.random() - 0.5) * 4;
    _v.z += (Math.random() - 0.5) * 6;
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: _v.x, vy: _v.y, vz: _v.z, size: 0.16, sizeEnd: 0.05, life: 0.3, r: 0.85, g: 0.93, b: 1, alpha: 0.8, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 2 });
  }
  g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: dir.x * 4, vy: 0.5, vz: dir.z * 4, size: 0.6, sizeEnd: 2.4 * k, life: 0.5, r: 0.88, g: 0.92, b: 0.96, alpha: 0.35, alphaEnd: 0, tex: TEX_PUFF });
}

// ------------------------------------------------------------------ Jakuhō Raikōben

/** The missile: launched slow, fins out, accelerating and homing, then the explosion. */
export class RaikobenMissile implements Projectile {
  done = false;
  readonly pos = new THREE.Vector3();
  private vel = new THREE.Vector3();
  private mesh: PropMesh;
  private t = 0;
  private boom = false;

  constructor(private g: Game, private owner: Fighter, model: VoxelModel, from: THREE.Vector3, dir: THREE.Vector3, private target: Fighter | null, readonly o: { damage: number; radius: number; power: number }) {
    this.pos.copy(from);
    this.vel.copy(dir).normalize().multiplyScalar(12);
    this.mesh = new PropMesh(model);
    this.mesh.position.copy(from);
    g.engine.gr.scene.add(this.mesh);
    this.orient();
  }

  private orient(): void {
    _v.copy(this.pos).add(this.vel);
    this.mesh.lookAt(_v);
  }

  update(dt: number, g: Game): void {
    if (this.boom) return;
    this.t += dt;
    // accelerate, and turn toward the target
    const speed = Math.min(70, 12 + this.t * 110);
    const dir = _w.copy(this.vel).normalize();
    const tgt = this.target;
    if (tgt && !tgt.dead && this.t > 0.15) {
      _v.subVectors(tgt.center(), this.pos).normalize();
      const turn = Math.min(1, dt * 3.2);
      dir.lerp(_v, turn).normalize();
    }
    this.vel.copy(dir).multiplyScalar(speed);
    const prev = this.pos.clone();
    this.pos.addScaledVector(this.vel, dt);
    this.mesh.position.copy(this.pos);
    this.orient();
    // smoke and fire off the tail
    const tail = this.pos.clone().addScaledVector(dir, -1.4);
    g.engine.dust.spawn({ x: tail.x, y: tail.y, z: tail.z, vx: (Math.random() - 0.5) * 0.6, vy: 0.4, vz: (Math.random() - 0.5) * 0.6, size: 0.6, sizeEnd: 2.2, life: 1.6, r: 0.62, g: 0.6, b: 0.58, alpha: 0.55, alphaEnd: 0, tex: TEX_PUFF, drag: 0.8 });
    g.engine.glow.spawn({ x: tail.x, y: tail.y, z: tail.z, vx: -dir.x * 8, vy: -dir.y * 8, vz: -dir.z * 8, size: 0.9, sizeEnd: 0.2, life: 0.12, r: 1, g: 0.75, b: 0.35, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    // impact: the target, the ground, a wall — or it runs out
    const w = g.engine.world, vs = w.vs;
    const solid = w.isSolid(Math.floor(this.pos.x / vs), Math.floor(this.pos.y / vs), Math.floor(this.pos.z / vs));
    let hit = solid && this.t > 0.2;
    for (const o of g.enemiesOf(this.owner)) if (o.center().distanceTo(this.pos) < 1.6 + o.def.radius) hit = true;
    if (hit || this.t > 5 || prev.y < -20) this.explode(g);
  }

  private explode(g: Game): void {
    this.boom = true;
    this.done = true;
    const p = this.pos.clone();
    const r = this.o.radius;
    g.engine.destruction.carve(new SphereShape(p, r, 0.85), { mode: 'explode', power: this.o.power, impulse: 26, dust: 1.2 });
    for (const o of g.fighters) {
      if (o.dead || o === this.owner) continue;
      const d = o.center().distanceTo(p);
      if (d > r * 1.6) continue;
      const fall = Math.max(0, 1 - d / (r * 1.6));
      const dir = o.center().sub(p).normalize();
      if (o.team === this.owner.team) continue;
      g.damage(o, this.o.damage * fall, this.owner, dir, { energy: true, knock: 30 * fall, launch: 14 * fall, heavy: true, hitstop: 0.15, shake: 1 });
    }
    // the fireball: white, then gold, then orange, under a rising smoke column
    for (let i = 0; i < 90; i++) {
      _v.set(Math.random() - 0.5, Math.random() * 0.8, Math.random() - 0.5).normalize().multiplyScalar(4 + Math.random() * r * 2.2);
      const k = Math.random();
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: _v.x, vy: _v.y, vz: _v.z, size: 1.2 + Math.random() * 1.6, sizeEnd: 0.4, life: 0.5 + Math.random() * 0.5, r: 1, g: k < 0.3 ? 0.97 : k < 0.65 ? 0.88 : 0.55, b: k < 0.3 ? 0.9 : k < 0.65 ? 0.48 : 0.16, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 2.5 });
    }
    for (let i = 0; i < 40; i++) {
      g.engine.dust.spawn({ x: p.x + (Math.random() - 0.5) * r, y: p.y + Math.random() * r * 0.6, z: p.z + (Math.random() - 0.5) * r, vx: (Math.random() - 0.5) * 3, vy: 3 + Math.random() * 5, vz: (Math.random() - 0.5) * 3, size: 2, sizeEnd: 6, life: 2.5 + Math.random() * 1.5, r: 0.29, g: 0.27, b: 0.25, alpha: 0.75, alphaEnd: 0, tex: TEX_PUFF, drag: 0.8 });
    }
    g.addRing(p.clone(), r * 2.4, '#FFE07A', 0.7);
    g.sfx.play('explode', p, 2);
    g.shake(1.2);
    g.hitstop(0.12);
    g.slowMo(0.4, 0.4);
    g.engine.gr.chroma.offset.set(0.01, 0.01);
    this.mesh.visible = false;
  }

  dispose(): void {
    this.mesh.removeFromParent();
  }
}
