// Shard burst: the voxel pieces of a broken prop (a Hollow mask) fly off from where the prop was,
// tumble, bounce on the voxel world and dissolve. Each piece is a real voxel mesh with the prop's
// palette, pivoting around its own centroid.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import { PropMesh } from '../game/characterFactory';
import type { Shard } from '../models/shatter';
import { TEX_GLOW, TEX_PUFF } from './sprites';

interface Piece {
  pivot: THREE.Group;
  mesh: PropMesh;
  v: THREE.Vector3;
  w: THREE.Vector3;
  life: number;
}

const _q = new THREE.Quaternion();
const _e = new THREE.Vector3();

export interface ShardBurstOpts {
  /** burst centre (world) */
  origin: THREE.Vector3;
  /** main throw direction (e.g. the face's forward) */
  dir: THREE.Vector3;
  speed: number;
  life: number;
  /** puff colour */
  dust?: THREE.ColorRepresentation;
}

export class ShardBurst implements Projectile {
  done = false;
  private pieces: Piece[] = [];
  private group = new THREE.Group();

  constructor(private g: Game, shards: Shard[], matrixWorld: THREE.Matrix4, o: ShardBurstOpts) {
    const pos = new THREE.Vector3(), rot = new THREE.Quaternion(), scl = new THREE.Vector3();
    matrixWorld.decompose(pos, rot, scl);
    for (const s of shards) {
      const mesh = new PropMesh(s.model);
      mesh.position.set(-s.center[0], -s.center[1], -s.center[2]);
      const pivot = new THREE.Group();
      pivot.add(mesh);
      pivot.position.set(...s.center).applyMatrix4(matrixWorld);
      pivot.quaternion.copy(rot);
      // outward from the burst centre, biased along the throw direction and up
      const out = pivot.position.clone().sub(o.origin);
      if (out.lengthSq() < 1e-6) out.set(Math.random() - 0.5, 0, Math.random() - 0.5);
      out.normalize();
      const k = o.speed * (0.55 + Math.random() * 0.7);
      const v = out.multiplyScalar(k).addScaledVector(o.dir, o.speed * (0.25 + Math.random() * 0.5));
      v.y += 2.5 + Math.random() * 3.5;
      const w = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(26);
      this.group.add(pivot);
      this.pieces.push({ pivot, mesh, v, w, life: o.life * (0.8 + Math.random() * 0.4) });
    }
    g.engine.gr.scene.add(this.group);
    // bone dust and a burst of reishi motes where it broke
    const dc = new THREE.Color(o.dust ?? '#F3F1EC');
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random();
      g.engine.dust.spawn({
        x: o.origin.x, y: o.origin.y, z: o.origin.z,
        vx: Math.cos(a) * r * 3 + o.dir.x * 2, vy: Math.random() * 2.5, vz: Math.sin(a) * r * 3 + o.dir.z * 2,
        size: 0.18, sizeEnd: 0.9, life: 0.9, r: dc.r, g: dc.g, b: dc.b, alpha: 0.75, alphaEnd: 0, tex: TEX_PUFF, drag: 3,
      });
    }
    for (let i = 0; i < 26; i++) {
      g.engine.glow.spawn({
        x: o.origin.x, y: o.origin.y, z: o.origin.z,
        vx: (Math.random() - 0.5) * 9 + o.dir.x * 3, vy: Math.random() * 6, vz: (Math.random() - 0.5) * 9 + o.dir.z * 3,
        size: 0.12, sizeEnd: 0.02, life: 0.6 + Math.random() * 0.5, r: 1, g: 0.97, b: 0.92, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 2.2, gravity: -2,
      });
    }
  }

  update(dt: number, g: Game): void {
    const w = g.engine.world;
    const vs = w.vs;
    let alive = 0;
    for (const p of this.pieces) {
      if (p.life <= 0) continue;
      p.life -= dt;
      alive++;
      const pos = p.pivot.position;
      p.v.y -= 22 * dt;
      p.v.multiplyScalar(Math.exp(-0.4 * dt));
      const nx = pos.x + p.v.x * dt, ny = pos.y + p.v.y * dt, nz = pos.z + p.v.z * dt;
      if (w.isSolid(Math.floor(nx / vs), Math.floor(pos.y / vs), Math.floor(pos.z / vs))) p.v.x *= -0.35;
      else pos.x = nx;
      if (w.isSolid(Math.floor(pos.x / vs), Math.floor(pos.y / vs), Math.floor(nz / vs))) p.v.z *= -0.35;
      else pos.z = nz;
      if (w.isSolid(Math.floor(pos.x / vs), Math.floor((ny - 0.03) / vs), Math.floor(pos.z / vs))) {
        if (p.v.y < 0) {
          p.v.y = Math.abs(p.v.y) > 2 ? -p.v.y * 0.32 : 0;
          p.v.x *= 0.55;
          p.v.z *= 0.55;
          p.w.multiplyScalar(0.5);
        }
      } else pos.y = ny;
      // tumble
      _e.copy(p.w).multiplyScalar(dt);
      const ang = _e.length();
      if (ang > 1e-5) {
        _q.setFromAxisAngle(_e.divideScalar(ang), ang);
        p.pivot.quaternion.premultiply(_q);
      }
      // dissolve over the last 0.7 s
      p.mesh.material.userData.uniforms.uDissolve.value = Math.max(0, Math.min(1, 1 - p.life / 0.7));
    }
    if (alive === 0) this.done = true;
  }

  render(_dt: number, time: number): void {
    for (const p of this.pieces) p.mesh.material.userData.uniforms.uTime.value = time;
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const p of this.pieces) p.mesh.material.dispose();
  }
}
