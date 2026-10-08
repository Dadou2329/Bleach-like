// Falling fragments: floating voxel components become Rapier dynamic bodies with voxel colliders.
//  - big components stay whole while they slide and topple (the "top of the building slides off the
//    cut" moment), then shatter into irregular Voronoi pieces on hard impact
//  - pieces that come to rest are re-rasterised into the world as rubble (destructible again)
import * as THREE from 'three';
import { RAPIER, type Physics } from '../physics/physics';
import { greedyMeshDense, type MeshBuffers } from '../voxel/mesher';
import type { VoxelWorld } from '../voxel/world';
import type { FloatingComponent } from './integrity';
import type { DebrisSystem } from '../vfx/debris';
import type { SpriteSystem } from '../vfx/sprites';

export class Fragment {
  sleepT = 0;
  age = 0;
  lastSpeed = 0;
  generation = 0;
  collider: RAPIER.Collider | null = null;
  /** while set, the piece slides on a smooth cut plane and ignores world voxels */
  slide: SlidePlane | null = null;
  /** carried (a chunk ripped up to be thrown): kinematic, never settled or shattered until let go */
  held = false;
  /** thrown through what stands in front (the wall it was torn out of): world voxels ignored for this long */
  ghostT = 0;
  slideT = 0;
  constructor(
    readonly grid: Uint8Array,
    readonly w: number,
    readonly h: number,
    readonly d: number,
    /** world-voxel origin of the grid at extraction (keeps shader colour hashing stable) */
    readonly ox: number,
    readonly oy: number,
    readonly oz: number,
    readonly count: number,
    readonly body: RAPIER.RigidBody,
    readonly mesh: THREE.Mesh,
  ) {}
}

/** A smooth temporary surface matching a planar cut: the cut piece slides on it instead of the voxel staircase. */
export interface SlidePlane {
  center: THREE.Vector3;
  normal: THREE.Vector3;
  downhill: THREE.Vector3;
  rot: THREE.Quaternion;
  halfU: number;
  halfW: number;
  /** created lazily */
  collider?: RAPIER.Collider;
  body?: RAPIER.RigidBody;
  expires?: number;
}

export interface SpawnOptions {
  vel?: THREE.Vector3;
  angVel?: THREE.Vector3;
  slide?: SlidePlane;
}

// collision groups: membership << 16 | filter
const G_WORLD = 0x0001, G_FRAG = 0x0002, G_SLIDE = 0x0004;
export const GROUPS_FRAGMENT = (G_FRAG << 16) | 0xffff;
const GROUPS_SLIDING = (G_FRAG << 16) | (G_FRAG | G_SLIDE);
const GROUPS_SLIDE_PLANE = (G_SLIDE << 16) | G_FRAG;
const GROUPS_GHOST = (G_FRAG << 16) | G_FRAG;
void G_WORLD;

interface PieceSpec {
  grid: Uint8Array;
  w: number; h: number; d: number;
  ox: number; oy: number; oz: number;
  pos: THREE.Vector3;
  rot: THREE.Quaternion;
  vel: THREE.Vector3;
  angVel: THREE.Vector3;
  generation: number;
  slide?: SlidePlane;
}

const _m = new THREE.Matrix4();
const _s = new THREE.Matrix4();
const _t = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();

export class FragmentSystem {
  readonly group = new THREE.Group();
  readonly fragments: Fragment[] = [];
  maxFragments = 200;
  /** largest single rigid piece (voxels); bigger components are split with Voronoi cells */
  maxSingle = 70000;
  /** pieces bigger than this shatter on hard impacts */
  fractureMin = 1500;
  private queue: (() => void)[] = [];
  stats = { spawned: 0, settled: 0, fractured: 0 };

  constructor(
    readonly world: VoxelWorld,
    readonly physics: Physics,
    readonly material: THREE.Material,
    readonly transMaterial: THREE.Material,
    readonly debris: DebrisSystem,
    readonly dust: SpriteSystem,
  ) {}

  get pending(): number {
    return this.queue.length;
  }

  /** Detach a component from the world and make it fall. */
  spawn(comp: FloatingComponent, opts: SpawnOptions = {}): void {
    if (comp.voxels.length <= this.maxSingle) {
      this.queue.push(() => this.extract(comp.voxels, opts));
      return;
    }
    const k = Math.ceil(comp.voxels.length / (this.maxSingle * 0.6));
    const sx = this.world.sx, sy = this.world.sy, sxy = sx * sy;
    const pts = new Int32Array(comp.voxels.length * 3);
    for (let i = 0; i < comp.voxels.length; i++) {
      const key = comp.voxels[i];
      pts[i * 3] = key % sx; pts[i * 3 + 1] = Math.floor(key / sx) % sy; pts[i * 3 + 2] = Math.floor(key / sxy);
    }
    const groups = voronoiGroups(pts, k);
    for (const g of groups) {
      const keys = new Float64Array(g.length);
      for (let j = 0; j < g.length; j++) keys[j] = comp.voxels[g[j]];
      this.queue.push(() => this.extract(keys, opts));
    }
  }

  /**
   * Pull voxels out of the world into one rigid piece now (not queued) and hand it over, held: a chunk ripped up to be
   * carried and thrown (Meninas). Null when there is too little there to make a piece.
   */
  grab(keys: Float64Array): Fragment | null {
    if (this.physics.broken) return null;
    const before = this.fragments.length;
    this.extract(keys, {});
    if (this.fragments.length <= before) return null;
    const f = this.fragments[this.fragments.length - 1];
    f.held = true;
    f.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
    return f;
  }

  /**
   * let a held piece go: dynamic again, with a velocity (thrown); `ghost` seconds passing through world voxels first
   * (what it is thrown through is smashed by whoever throws it)
   */
  release(f: Fragment, vel: THREE.Vector3, angVel = new THREE.Vector3(), ghost = 0): void {
    if (!f.body.isValid()) return;
    f.held = false;
    f.age = 0;
    f.lastSpeed = vel.length();
    f.body.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
    f.body.setLinvel({ x: vel.x, y: vel.y, z: vel.z }, true);
    f.body.setAngvel({ x: angVel.x, y: angVel.y, z: angVel.z }, true);
    if (ghost > 0) {
      f.ghostT = ghost;
      f.collider?.setCollisionGroups(GROUPS_GHOST);
    }
  }

  /** a piece that still exists (it may have settled, shattered or fallen out of the world) */
  alive(f: Fragment): boolean {
    return this.fragments.includes(f) && f.body.isValid();
  }

  /** Pull voxels out of the world into one rigid piece. */
  private extract(keys: Float64Array, opts: SpawnOptions): void {
    const w = this.world;
    const vs = w.vs;
    const sx = w.sx, sy = w.sy, sxy = sx * sy;
    let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -1, maxY = -1, maxZ = -1;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const x = k % sx, y = Math.floor(k / sx) % sy, z = Math.floor(k / sxy);
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
    const gw = maxX - minX + 1, gh = maxY - minY + 1, gd = maxZ - minZ + 1;
    const grid = new Uint8Array(gw * gh * gd);
    let count = 0;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const x = k % sx, y = Math.floor(k / sx) % sy, z = Math.floor(k / sxy);
      const m = w.get(x, y, z);
      if (m === 0) continue;
      grid[x - minX + gw * (y - minY + gh * (z - minZ))] = m;
      w.set(x, y, z, 0);
      count++;
    }
    if (count === 0) return;
    const vel = opts.vel ?? new THREE.Vector3();
    if (count < 10) {
      this.toDebris(grid, gw, gh, gd, new THREE.Vector3(minX * vs, minY * vs, minZ * vs), new THREE.Quaternion(), vel);
      return;
    }
    this.create({
      grid, w: gw, h: gh, d: gd, ox: minX, oy: minY, oz: minZ,
      pos: new THREE.Vector3(minX * vs, minY * vs, minZ * vs), rot: new THREE.Quaternion(),
      vel, angVel: opts.angVel ?? new THREE.Vector3(), generation: 0, slide: opts.slide,
    });
    this.physics.require(minX - 32, 0, minZ - 32, maxX + 32, maxY + 8, maxZ + 32, true);
  }

  private create(p: PieceSpec): void {
    // without rigid bodies (Rapier failed) the piece goes as loose debris
    if (this.physics.broken) {
      this.toDebris(p.grid, p.w, p.h, p.d, p.pos, p.rot, p.vel);
      return;
    }
    const vs = this.world.vs;
    const coords: number[] = [];
    let massSum = 0, count = 0;
    for (let z = 0; z < p.d; z++)
      for (let y = 0; y < p.h; y++)
        for (let x = 0; x < p.w; x++) {
          const m = p.grid[x + p.w * (y + p.h * z)];
          if (!m) continue;
          coords.push(x, y, z);
          massSum += this.world.mats.density[m];
          count++;
        }
    if (count === 0) return;
    const rb = this.physics.rw.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(p.pos.x, p.pos.y, p.pos.z)
        .setRotation({ x: p.rot.x, y: p.rot.y, z: p.rot.z, w: p.rot.w })
        .setLinearDamping(0.05)
        .setAngularDamping(0.2)
        .setCcdEnabled(count < 400),
    );
    rb.userData = { fragment: true };
    const col = this.physics.rw.createCollider(
      RAPIER.ColliderDesc.voxels(new Int32Array(coords), { x: vs, y: vs, z: vs })
        .setDensity((massSum / count) * 900)
        .setFriction(0.75)
        .setRestitution(0.06)
        .setCollisionGroups(p.slide ? GROUPS_SLIDING : GROUPS_FRAGMENT),
      rb,
    );
    if (p.slide) this.ensureSlidePlane(p.slide);
    rb.setLinvel({ x: p.vel.x, y: p.vel.y, z: p.vel.z }, true);
    rb.setAngvel({ x: p.angVel.x, y: p.angVel.y, z: p.angVel.z }, true);
    const mesh = this.buildMesh(p);
    this.group.add(mesh);
    const frag = new Fragment(p.grid, p.w, p.h, p.d, p.ox, p.oy, p.oz, count, rb, mesh);
    frag.generation = p.generation;
    frag.collider = col;
    frag.slide = p.slide ?? null;
    this.fragments.push(frag);
    this.syncMesh(frag);
    this.stats.spawned++;
    while (this.fragments.length > this.maxFragments) {
      const old = this.fragments.find((x) => !x.held);
      if (!old) break;
      this.settle(old);
    }
  }

  private buildMesh(p: PieceSpec): THREE.Mesh {
    const res = greedyMeshDense(p.grid, p.w, p.h, p.d, this.world.mats.flags);
    const mk = (buf: MeshBuffers, mat: THREE.Material) => {
      const pos = new Uint16Array(buf.positions.length);
      for (let i = 0; i < pos.length; i += 3) {
        pos[i] = buf.positions[i] + p.ox;
        pos[i + 1] = buf.positions[i + 1] + p.oy;
        pos[i + 2] = buf.positions[i + 2] + p.oz;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(buf.normals, 3, true));
      g.setAttribute('aVox', new THREE.BufferAttribute(buf.vox, 2));
      g.setIndex(new THREE.BufferAttribute(buf.indices, 1));
      g.computeBoundingSphere();
      const mesh = new THREE.Mesh(g, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.matrixAutoUpdate = false;
      return mesh;
    };
    const mesh = res.opaque ? mk(res.opaque, this.material) : new THREE.Mesh(new THREE.BufferGeometry(), this.material);
    mesh.matrixAutoUpdate = false;
    if (res.transparent) mesh.add(mk(res.transparent, this.transMaterial));
    return mesh;
  }

  private syncMesh(f: Fragment): void {
    const t = f.body.translation(), r = f.body.rotation();
    const vs = this.world.vs;
    _q.set(r.x, r.y, r.z, r.w);
    _m.makeRotationFromQuaternion(_q).setPosition(t.x, t.y, t.z);
    _s.makeScale(vs, vs, vs);
    _t.makeTranslation(-f.ox, -f.oy, -f.oz);
    f.mesh.matrix.copy(_m).multiply(_s).multiply(_t);
    f.mesh.matrixWorldNeedsUpdate = true;
  }

  /** Shatter a fragment into irregular pieces that keep its motion. */
  fracture(f: Fragment, impactSpeed: number): void {
    const vs = this.world.vs;
    const pts: number[] = [];
    for (let z = 0; z < f.d; z++)
      for (let y = 0; y < f.h; y++)
        for (let x = 0; x < f.w; x++) if (f.grid[x + f.w * (y + f.h * z)]) pts.push(x, y, z);
    const k = Math.max(3, Math.min(14, Math.round(f.count / 2500)));
    const groups = voronoiGroups(Int32Array.from(pts), k);
    const t = f.body.translation(), r = f.body.rotation();
    const lv = f.body.linvel(), av = f.body.angvel();
    const rot = new THREE.Quaternion(r.x, r.y, r.z, r.w);
    const bodyPos = new THREE.Vector3(t.x, t.y, t.z);
    const angVel = new THREE.Vector3(av.x, av.y, av.z);
    const com = new THREE.Vector3();
    this.remove(f);
    for (const g of groups) {
      let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -1, maxY = -1, maxZ = -1;
      for (const i of g) {
        const x = pts[i * 3], y = pts[i * 3 + 1], z = pts[i * 3 + 2];
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
      }
      const w = maxX - minX + 1, h = maxY - minY + 1, d = maxZ - minZ + 1;
      const grid = new Uint8Array(w * h * d);
      for (const i of g) {
        const x = pts[i * 3], y = pts[i * 3 + 1], z = pts[i * 3 + 2];
        grid[x - minX + w * (y - minY + h * (z - minZ))] = f.grid[x + f.w * (y + f.h * z)];
      }
      const local = new THREE.Vector3(minX * vs, minY * vs, minZ * vs);
      const pos = local.clone().applyQuaternion(rot).add(bodyPos);
      // velocity of this piece = v + ω × r, plus a burst away from the parent centre
      com.set((minX + w / 2) * vs, (minY + h / 2) * vs, (minZ + d / 2) * vs).applyQuaternion(rot);
      const vel = new THREE.Vector3(lv.x, lv.y, lv.z).add(new THREE.Vector3().crossVectors(angVel, com));
      const burst = com.clone().setY(0).normalize().multiplyScalar(impactSpeed * (0.15 + Math.random() * 0.2));
      vel.multiplyScalar(0.35).add(burst).add(new THREE.Vector3(0, impactSpeed * (0.1 + Math.random() * 0.15), 0));
      const ang = angVel.clone().multiplyScalar(0.5).add(new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5), (Math.random() - 0.5) * 2));
      if (g.length < 10) {
        this.toDebris(grid, w, h, d, pos, rot, vel);
        continue;
      }
      this.create({ grid, w, h, d, ox: f.ox + minX, oy: f.oy + minY, oz: f.oz + minZ, pos, rot: rot.clone(), vel, angVel: ang, generation: f.generation + 1 });
    }
    // crumble burst: debris + heavy dust where it hit
    const n = Math.min(160, Math.floor(f.count / 60));
    for (let i = 0; i < n; i++) {
      const j = Math.floor(Math.random() * (pts.length / 3));
      const p = new THREE.Vector3((pts[j * 3] + 0.5) * vs, (pts[j * 3 + 1] + 0.5) * vs, (pts[j * 3 + 2] + 0.5) * vs).applyQuaternion(rot).add(bodyPos);
      const m = f.grid[pts[j * 3] + f.w * (pts[j * 3 + 1] + f.h * pts[j * 3 + 2])];
      const sp = impactSpeed * (0.2 + Math.random() * 0.5);
      const a = Math.random() * Math.PI * 2;
      this.debris.spawn(p.x, p.y, p.z, Math.cos(a) * sp, Math.random() * sp * 0.8 + 2, Math.sin(a) * sp, vs * (0.6 + Math.random() * 0.8), m, 3 + Math.random() * 3);
    }
    this.impactDust(bodyPos, Math.max(f.w, f.d) * vs, impactSpeed, Math.sqrt(f.count));
    this.stats.fractured++;
  }

  private toDebris(grid: Uint8Array, w: number, h: number, d: number, pos: THREE.Vector3, rot: THREE.Quaternion, vel: THREE.Vector3): void {
    const vs = this.world.vs;
    for (let z = 0; z < d; z++)
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const m = grid[x + w * (y + h * z)];
          if (!m) continue;
          _v.set((x + 0.5) * vs, (y + 0.5) * vs, (z + 0.5) * vs).applyQuaternion(rot).add(pos);
          this.debris.spawn(_v.x, _v.y, _v.z, vel.x + (Math.random() - 0.5) * 2, vel.y + Math.random() * 2, vel.z + (Math.random() - 0.5) * 2, vs, m, 5);
        }
  }

  /** Bake a fragment back into the world grid as rubble. */
  settle(f: Fragment): void {
    const w = this.world;
    const vs = w.vs;
    const t = f.body.translation(), r = f.body.rotation();
    _q.set(r.x, r.y, r.z, r.w);
    const p = new THREE.Vector3();
    for (let z = 0; z < f.d; z++)
      for (let y = 0; y < f.h; y++)
        for (let x = 0; x < f.w; x++) {
          const m = f.grid[x + f.w * (y + f.h * z)];
          if (!m) continue;
          p.set((x + 0.5) * vs, (y + 0.5) * vs, (z + 0.5) * vs).applyQuaternion(_q);
          const wx = Math.floor((p.x + t.x) / vs), wy = Math.floor((p.y + t.y) / vs), wz = Math.floor((p.z + t.z) / vs);
          if (w.inBounds(wx, wy, wz) && w.get(wx, wy, wz) === 0) w.set(wx, wy, wz, m);
        }
    this.remove(f);
    this.stats.settled++;
  }

  /**
   * Take away the falling pieces whose centre is within `radius` of `c` (Sōten Kisshun puts their voxels back
   * where they were, so the pieces must go). Returns the centres of the pieces removed.
   */
  dissolveNear(c: THREE.Vector3, radius: number): THREE.Vector3[] {
    const out: THREE.Vector3[] = [];
    const vs = this.world.vs;
    for (let i = this.fragments.length - 1; i >= 0; i--) {
      const f = this.fragments[i];
      if (!f.body.isValid()) continue;
      const t = f.body.translation(), r = f.body.rotation();
      _q.set(r.x, r.y, r.z, r.w);
      const centre = new THREE.Vector3(f.w * vs * 0.5, f.h * vs * 0.5, f.d * vs * 0.5).applyQuaternion(_q).add(_v.set(t.x, t.y, t.z));
      if (centre.distanceTo(c) > radius) continue;
      out.push(centre);
      this.remove(f);
    }
    return out;
  }

  private remove(f: Fragment): void {
    if (!this.physics.broken && f.body.isValid()) this.physics.rw.removeRigidBody(f.body);
    this.group.remove(f.mesh);
    f.mesh.geometry.dispose();
    for (const c of f.mesh.children) (c as THREE.Mesh).geometry.dispose();
    const i = this.fragments.indexOf(f);
    if (i >= 0) this.fragments.splice(i, 1);
  }

  update(dt: number): void {
    for (let i = this.slidePlanes.length - 1; i >= 0; i--) {
      const sp = this.slidePlanes[i];
      if (this.physics.time > (sp.expires ?? 0) && sp.body) {
        if (!this.physics.broken && sp.body.isValid()) this.physics.rw.removeRigidBody(sp.body);
        sp.body = undefined;
        sp.collider = undefined;
        this.slidePlanes.splice(i, 1);
      }
    }
    if (this.physics.broken) {
      // the bodies are gone with the physics world: let the pieces go
      for (const f of this.fragments.splice(0)) {
        this.group.remove(f.mesh);
        f.mesh.geometry.dispose();
        for (const c of f.mesh.children) (c as THREE.Mesh).geometry.dispose();
      }
      this.slidePlanes.length = 0;
      this.queue.length = 0;
      return;
    }
    const t0 = performance.now();
    while (this.queue.length > 0 && performance.now() - t0 < 8) this.queue.shift()!();
    const vs = this.world.vs;
    for (let i = 0; i < this.fragments.length; i++) {
      const f = this.fragments[i];
      f.age += dt;
      if (f.slide) {
        f.slideT += dt;
        if (f.slideT > 6 || (Math.floor(f.slideT * 60) % 4 === 0 && this.clearOfWorld(f))) {
          f.slide = null;
          f.collider?.setCollisionGroups(GROUPS_FRAGMENT);
          f.lastSpeed = 0;
        }
      }
      this.syncMesh(f);
      if (f.held) continue;
      if (f.ghostT > 0 && (f.ghostT -= dt) <= 0) f.collider?.setCollisionGroups(f.slide ? GROUPS_SLIDING : GROUPS_FRAGMENT);
      const t = f.body.translation();
      const v = f.body.linvel();
      const speed = Math.hypot(v.x, v.y, v.z);
      const drop = f.lastSpeed - speed;
      f.lastSpeed = speed;
      if (t.y < -10) { this.remove(f); i--; continue; }
      // hard impact → shatter (big pieces) or puff dust (small ones)
      if (drop > 3.5 && f.age > 0.1 && !f.slide) {
        if (f.count >= this.fractureMin && f.generation < 2) { this.fracture(f, drop + 4); i--; continue; }
        if (f.count > 60) this.impactDust(new THREE.Vector3(t.x, t.y, t.z), Math.max(f.w, f.d) * vs, drop, Math.sqrt(f.count) * 0.5);
      }
      if (!f.slide && (f.body.isSleeping() || speed < 0.05)) f.sleepT += dt;
      else {
        f.sleepT = 0;
        const x = Math.floor(t.x / vs), y = Math.floor(t.y / vs), z = Math.floor(t.z / vs);
        const r = Math.max(f.w, f.h, f.d);
        this.physics.require(x - r - 8, y - r - 24, z - r - 8, x + r + 8, y + r + 8, z + r + 8);
      }
      if (f.sleepT > 1.2 || f.age > 25) { this.settle(f); i--; }
    }
  }

  private ensureSlidePlane(sp: SlidePlane): void {
    sp.expires = this.physics.time + 7;
    if (sp.body) return;
    sp.body = this.physics.rw.createRigidBody(
      RAPIER.RigidBodyDesc.fixed()
        .setTranslation(sp.center.x - sp.normal.x * 0.06, sp.center.y - sp.normal.y * 0.06, sp.center.z - sp.normal.z * 0.06)
        .setRotation({ x: sp.rot.x, y: sp.rot.y, z: sp.rot.z, w: sp.rot.w }),
    );
    sp.collider = this.physics.rw.createCollider(
      RAPIER.ColliderDesc.cuboid(sp.halfU, 0.06, sp.halfW).setFriction(0.02).setCollisionGroups(GROUPS_SLIDE_PLANE),
      sp.body,
    );
    this.slidePlanes.push(sp);
  }

  private slidePlanes: SlidePlane[] = [];

  /**
   * True when the piece's underside is clear of the world: for sampled (x,z) columns, the lowest
   * voxel and the 3 voxels below it (in world space) must be empty.
   */
  private clearOfWorld(f: Fragment): boolean {
    if (f.slideT < 0.5) return false;
    const w = this.world;
    const vs = w.vs;
    const t = f.body.translation(), r = f.body.rotation();
    _q.set(r.x, r.y, r.z, r.w);
    const step = Math.max(1, Math.floor(Math.sqrt((f.w * f.d) / 400)));
    let tested = 0;
    for (let z = 0; z < f.d; z += step)
      for (let x = 0; x < f.w; x += step) {
        let y = 0;
        while (y < f.h && !f.grid[x + f.w * (y + f.h * z)]) y++;
        if (y >= f.h) continue;
        _v.set((x + 0.5) * vs, (y + 0.5) * vs, (z + 0.5) * vs).applyQuaternion(_q);
        const px = _v.x + t.x, py = _v.y + t.y, pz = _v.z + t.z;
        tested++;
        for (let k = 0; k <= 3; k++) if (w.isSolidAtPos(px, py - k * vs, pz)) return false;
      }
    return tested > 0;
  }

  private impactDust(p: THREE.Vector3, extent: number, speed: number, scale: number): void {
    const n = Math.min(26, 3 + Math.floor(scale * 0.18));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, rr = Math.random() * extent * 0.7;
      this.dust.spawn({
        x: p.x + Math.cos(a) * rr, y: p.y + Math.random() * 0.8, z: p.z + Math.sin(a) * rr,
        vx: Math.cos(a) * (1 + speed * 0.15), vy: 0.4 + Math.random() * 1.6, vz: Math.sin(a) * (1 + speed * 0.15),
        size: 1.5 + Math.random() * 2, sizeEnd: 5 + Math.random() * 5 + scale * 0.03, life: 2.5 + Math.random() * 2.5,
        r: 0.58, g: 0.56, b: 0.52, alpha: 0.6, alphaEnd: 0, drag: 1.1, spin: (Math.random() - 0.5) * 0.4,
      });
    }
  }
}

/**
 * Split points (x,y,z triples) into k irregular groups: nearest of k random seeds, with a per-seed
 * anisotropic metric so the cells look like fractures rather than boxes.
 */
export function voronoiGroups(pts: Int32Array, k: number): number[][] {
  const n = pts.length / 3;
  k = Math.max(1, Math.min(k, n));
  const seeds: number[] = [];
  const scale: number[] = [];
  for (let i = 0; i < k; i++) {
    const j = Math.floor(Math.random() * n);
    seeds.push(pts[j * 3], pts[j * 3 + 1], pts[j * 3 + 2]);
    scale.push(0.6 + Math.random() * 0.8, 0.6 + Math.random() * 0.8, 0.6 + Math.random() * 0.8);
  }
  const groups: number[][] = Array.from({ length: k }, () => []);
  for (let i = 0; i < n; i++) {
    const x = pts[i * 3], y = pts[i * 3 + 1], z = pts[i * 3 + 2];
    let best = 0, bd = Infinity;
    for (let s = 0; s < k; s++) {
      const dx = (x - seeds[s * 3]) * scale[s * 3], dy = (y - seeds[s * 3 + 1]) * scale[s * 3 + 1], dz = (z - seeds[s * 3 + 2]) * scale[s * 3 + 2];
      const d = dx * dx + dy * dy + dz * dz;
      if (d < bd) { bd = d; best = s; }
    }
    groups[best].push(i);
  }
  return groups.filter((g) => g.length > 0);
}
