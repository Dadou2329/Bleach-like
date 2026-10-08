// TYBW Hitsugaya's ice (docs/kits/hitsugaya.md): Rokui Hyōketsujin — six snowflake sigils in a hexagon round the
// target, lines of ice from each, then the whole hexagon a pillar; Ryōjin Hyōheki — a wall of finely woven threads of
// ice that stops shots; Shinkū no Kōri no Yaiba — the hollow vacuum-ice blade fired out of the wall, that impales and
// pins; the adult's frost markers (where each Shunpo lands) and Shikai Hyōketsu — the box between them frozen solid,
// earth, water, fire and wind and every power inside it.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { BoxShape, SphereShape } from '../destruction/shapes';
import { ICE_TINT, IcePrison, crystalGeometry, crystalMaterial, frostWorld, iceSpike } from './ice';
import { GlassShards } from './mirror';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

/** a flat six-armed snowflake (in XZ), radius 1, with a pair of branches on every arm */
function snowflakeGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const bar = (len: number, w: number, x: number, z: number, a: number) => {
    const g = new THREE.PlaneGeometry(w, len);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, len / 2);
    g.rotateY(a);
    g.translate(x, 0, z);
    parts.push(g);
  };
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    bar(1, 0.12, 0, 0, a);
    for (const u of [0.45, 0.72]) {
      const bx = Math.sin(a) * u, bz = Math.cos(a) * u;
      bar(0.32 * (1.1 - u), 0.08, bx, bz, a + 0.8);
      bar(0.32 * (1.1 - u), 0.08, bx, bz, a - 0.8);
    }
  }
  parts.push(new THREE.CircleGeometry(0.16, 6).rotateX(-Math.PI / 2));
  const merged = mergeGeometries(parts);
  for (const p of parts) p.dispose();
  return merged;
}

/** a minimal merge (positions only) */
function mergeGeometries(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const pos: number[] = [];
  for (const g of list) {
    const ng = g.index ? g.toNonIndexed() : g;
    const a = ng.getAttribute('position');
    for (let i = 0; i < a.count; i++) pos.push(a.getX(i), a.getY(i), a.getZ(i));
    if (ng !== g) ng.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return out;
}

let flakeGeo: THREE.BufferGeometry | null = null;
function flakeMesh(color: THREE.ColorRepresentation, size: number): THREE.Mesh {
  flakeGeo ??= snowflakeGeometry();
  const m = new THREE.Mesh(flakeGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.scale.setScalar(size);
  m.renderOrder = 6;
  return m;
}

function groundY(g: Game, x: number, y: number, z: number): number {
  const w = g.engine.world, vs = w.vs;
  const ix = Math.floor(x / vs), iz = Math.floor(z / vs);
  for (let iy = Math.floor((y + 1) / vs); iy > Math.floor((y - 6) / vs); iy--) if (w.isSolid(ix, iy, iz)) return (iy + 1) * vs;
  return y;
}

/**
 * Rokui Hyōketsujin: six snowflake sigils bloom on a hexagon round `center`; lines of ice shoot from each into whoever
 * stands inside, then the hexagon closes into a pillar of ice round them.
 */
export class RokuiTrap implements Projectile {
  done = false;
  private t = 0;
  private sigils: { mesh: THREE.Mesh; p: THREE.Vector3 }[] = [];
  private lined = false;
  private closed = false;
  private group = new THREE.Group();

  constructor(private g: Game, readonly owner: Fighter, readonly center: THREE.Vector3, readonly radius = 3.6, readonly o = { lineDamage: 14, damage: 70, hold: 2.6 }) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const x = center.x + Math.cos(a) * radius, z = center.z + Math.sin(a) * radius;
      const p = new THREE.Vector3(x, groundY(g, x, center.y, z) + 0.04, z);
      const mesh = flakeMesh('#BFEFFF', 0.9);
      mesh.position.copy(p);
      this.group.add(mesh);
      this.sigils.push({ mesh, p });
    }
    g.engine.gr.scene.add(this.group);
    g.sfx.play('ting', center, 0.8);
  }

  private inside(): Fighter[] {
    return this.g.enemiesOf(this.owner).filter((o) => !o.dead && Math.hypot(o.pos.x - this.center.x, o.pos.z - this.center.z) < this.radius * 0.92 && Math.abs(o.pos.y - this.center.y) < 3);
  }

  update(dt: number, g: Game): void {
    if (this.done) return;
    this.t += dt;
    // the sigils bloom one after another, then glow
    this.sigils.forEach((s, i) => {
      const k = Math.max(0, Math.min(1, (this.t - i * 0.035) / 0.12));
      const m = s.mesh.material as THREE.MeshBasicMaterial;
      m.opacity = k * (this.closed ? Math.max(0, 1 - (this.t - 0.6) * 2) : 0.9);
      s.mesh.rotation.y = this.t * 0.6 + i;
      if (Math.random() < 0.3) g.engine.glow.spawn({ x: s.p.x + (Math.random() - 0.5) * 0.8, y: s.p.y + 0.05, z: s.p.z + (Math.random() - 0.5) * 0.8, vx: 0, vy: 0.8, vz: 0, size: 0.1, sizeEnd: 0.02, life: 0.4, r: 0.85, g: 0.96, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    });
    // the lines of ice: from every sigil at whoever is inside
    if (!this.lined && this.t >= 0.33) {
      this.lined = true;
      const victims = this.inside();
      for (const s of this.sigils) {
        const tgt = victims[0]?.center(_v) ?? this.center.clone().setY(this.center.y + 1);
        const dir = _w.subVectors(tgt, s.p);
        const len = dir.length();
        iceSpike(g, s.p.clone().setY(s.p.y + 0.15), dir.normalize(), Math.max(0.5, len - 0.6), 0.22, 600);
      }
      for (const o of victims) {
        g.damage(o, this.o.lineDamage * 6, this.owner, _w.subVectors(o.pos, this.center).setY(0).normalize().clone(), { knock: 0, hitstop: 0.06, shake: 0.2, quiet: true });
        o.slow(0.6, 1.2);
      }
      g.sfx.play('crack', this.center, 1);
    }
    // the hexagon closes: a pillar round whoever is still inside
    if (!this.closed && this.t >= 0.57) {
      this.closed = true;
      const victims = this.inside();
      for (const o of victims) g.addProjectile(new IcePrison(g, this.owner, o, this.o.hold, this.o.damage, 'obelisk', 1.5));
      // the pillar itself, written into the world
      iceSpike(g, this.center.clone().setY(this.center.y), UP, 7, this.radius * 0.95, 9000);
      frostWorld(g, this.center.clone().setY(this.center.y + 0.3), this.radius * 1.2, 1600);
      g.shake(0.4);
      g.sfx.play('shatter', this.center, 0.6);
      g.callout('六衣氷結陣', 'ROKUI HYŌKETSUJIN', '#bfefff');
    }
    if (this.t > 1.2) this.done = true;
  }

  dispose(): void {
    for (const s of this.sigils) (s.mesh.material as THREE.Material).dispose();
    this.group.removeFromParent();
  }
}

/**
 * Ryōjin Hyōheki: a wall of woven ice threads across the line of fire. Enemy shots that reach it come apart; it melts
 * away (the voxels go) when its time is up. `fireBlade` sends Shinkū no Kōri no Yaiba out of it.
 */
export class WovenWall implements Projectile {
  done = false;
  private t = 0;
  private cells: [number, number, number][] = [];
  readonly normal: THREE.Vector3;
  readonly side: THREE.Vector3;

  constructor(private g: Game, readonly owner: Fighter, readonly center: THREE.Vector3, facing: THREE.Vector3, readonly life = 8, readonly w = 5, readonly h = 3.6) {
    this.normal = facing.clone().setY(0).normalize();
    this.side = new THREE.Vector3().crossVectors(this.normal, UP).normalize();
    const world = g.engine.world, vs = world.vs, ice = world.mats.id('ice');
    const base = groundY(g, center.x, center.y, center.z);
    // threads: two families of diagonals woven through each other, a frame round the edge
    for (let u = -w / 2; u <= w / 2; u += vs) {
      for (let y = 0; y <= h; y += vs) {
        for (let d = -0.2; d <= 0.2; d += vs) {
          const a = ((u + y) / 0.5) % 1, b = ((u - y) / 0.5) % 1;
          const thread = Math.abs(a) < 0.3 || Math.abs(b) < 0.3 || Math.abs(Math.abs(u) - w / 2) < vs * 1.5 || y < vs * 1.5 || y > h - vs * 1.5;
          if (!thread) continue;
          const p = _v.copy(center).addScaledVector(this.side, u).addScaledVector(this.normal, d);
          const x = Math.floor(p.x / vs), yy = Math.floor((base + y) / vs), z = Math.floor(p.z / vs);
          if (world.get(x, yy, z) !== 0) continue;
          if (g.fighters.some((f) => Math.hypot(f.pos.x - (x + 0.5) * vs, f.pos.z - (z + 0.5) * vs) < f.def.radius && (yy + 0.5) * vs > f.pos.y - 0.1 && (yy + 0.5) * vs < f.pos.y + f.def.height)) continue;
          world.set(x, yy, z, ice);
          this.cells.push([x, yy, z]);
        }
      }
    }
    g.sfx.play('crack', center, 0.8);
    g.callout('綾陣氷壁', 'RYŌJIN HYŌHEKI', '#bfefff');
  }

  update(dt: number, g: Game): void {
    if (this.done) return;
    this.t += dt;
    // what reaches the wall comes apart on it
    for (const k of [-0.4, 0, 0.4]) g.rejectNear(_v.copy(this.center).addScaledVector(this.side, k * this.w).setY(this.center.y + 1.4), 2.1, this.owner, false);
    if (Math.random() < 0.2) {
      const p = _v.copy(this.center).addScaledVector(this.side, (Math.random() - 0.5) * this.w).setY(this.center.y + Math.random() * this.h);
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: 0, vy: 0.2, vz: 0, size: 0.1, sizeEnd: 0.02, life: 0.5, r: 0.85, g: 0.96, b: 1, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
    }
    if (this.t >= this.life) this.melt();
  }

  /** the wall's work is done: its threads melt away */
  melt(): void {
    if (this.done) return;
    this.done = true;
    const world = this.g.engine.world, ice = world.mats.id('ice');
    for (const [x, y, z] of this.cells) if (world.get(x, y, z) === ice) world.set(x, y, z, 0);
    this.g.addProjectile(new GlassShards(this.g, this.center.clone().setY(this.center.y + this.h / 2), new THREE.Vector3(this.w / 2, this.h / 2, 0.2), 40, 2.5, 1, this.center.y, ICE_TINT, 0.8));
  }

  dispose(): void {}
}

/**
 * Shinkū no Kōri no Yaiba: the vacuum gathered into a huge hollow blade of ice, launched point-first. It impales what
 * it reaches and pins it (rooted) where it stands; it bores through anything in its way.
 */
export class VacuumBlade implements Projectile {
  done = false;
  private t = 0;
  private pos: THREE.Vector3;
  private mesh: THREE.InstancedMesh;
  private mat = crystalMaterial(0.9, 1.4);
  private shape: { o: THREE.Vector3; s: number }[] = [];
  private pinned: Fighter | null = null;
  private pinT = 0;
  private travelled = 0;
  private boreT = 0;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, readonly dir: THREE.Vector3, readonly o = { damage: 110, speed: 45, range: 70, pin: 2.5 }) {
    this.pos = from.clone();
    this.dir = dir.clone().normalize();
    // a hollow cone of crystals: rings narrowing to the point
    for (let r = 0; r < 7; r++) {
      const along = r * 0.42;
      const rad = 0.5 * (1 - r / 7) + 0.06;
      const n = Math.max(3, Math.round(8 * (1 - r / 8)));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        this.shape.push({ o: new THREE.Vector3(Math.cos(a) * rad, Math.sin(a) * rad, along), s: 0.5 + (1 - r / 7) * 0.4 });
      }
    }
    this.mesh = new THREE.InstancedMesh(crystalGeometry(), this.mat, this.shape.length);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
    g.engine.gr.scene.add(this.mesh);
    g.sfx.play('getsuga', from, 0.9);
    g.callout('真空の氷の刃', 'SHINKŪ NO KŌRI NO YAIBA', '#bfefff');
  }

  update(dt: number, g: Game): void {
    if (this.done) return;
    this.t += dt;
    const o = this.pinned;
    if (o) {
      // pinned: held fast until the ice lets go
      this.pinT -= dt;
      o.rooted = this.pinT > 0 && !o.dead;
      if (this.pinT <= 0 || o.dead) {
        o.rooted = false;
        this.done = true;
        g.addProjectile(new GlassShards(g, this.pos.clone(), new THREE.Vector3(0.5, 0.5, 1.2), 30, 3, 1, o.pos.y, ICE_TINT, 0.8));
      }
      return;
    }
    const step = this.o.speed * dt;
    this.pos.addScaledVector(this.dir, step);
    this.travelled += step;
    this.boreT -= dt;
    if (this.boreT <= 0) {
      this.boreT = 0.03;
      g.engine.destruction.carve(new SphereShape(this.pos.clone().addScaledVector(this.dir, 1.2), 0.75, 0.35), { mode: 'cut', power: 520, dir: this.dir.clone(), dust: 0.4, sparks: [0.75, 0.93, 1] });
    }
    const tip = _v.copy(this.pos).addScaledVector(this.dir, 2.8);
    for (const f of g.enemiesOf(this.owner)) {
      if (f.dead) continue;
      if (f.center(_w).distanceTo(tip) > 0.9 + f.def.radius) continue;
      g.damage(f, this.o.damage, this.owner, this.dir.clone(), { knock: 0, hitstop: 0.12, shake: 0.5, heavy: true });
      g.sparks(_w.clone(), this.dir, ICE_TINT, 16);
      if (!f.dead) {
        this.pinned = f;
        this.pinT = this.o.pin;
        f.rooted = true;
        f.hitstun = Math.max(f.hitstun, 0.6);
        this.pos.copy(f.center(_w)).addScaledVector(this.dir, -1.6);
      }
      return;
    }
    if (this.travelled >= this.o.range) {
      this.done = true;
      g.addProjectile(new GlassShards(g, this.pos.clone(), new THREE.Vector3(0.5, 0.5, 1.2), 30, 3, 1, this.pos.y - 3, ICE_TINT, 0.8));
    }
  }

  render(): void {
    const grow = Math.min(1, this.t / 0.1);
    _q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.dir);
    this.shape.forEach((sh, i) => {
      const p = _v.copy(sh.o).applyQuaternion(_q).add(this.pos);
      const d = _w.copy(this.dir);
      const q = new THREE.Quaternion().setFromUnitVectors(UP, d);
      const s = sh.s * grow;
      _s.set(0.5 * s, 1.6 * s, 0.5 * s);
      _m.compose(p, q, _s);
      this.mesh.setMatrixAt(i, _m);
    });
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    if (this.pinned) this.pinned.rooted = false;
    this.mesh.removeFromParent();
    this.mat.dispose();
  }
}

/** A frost marker: where a Shunpo landed, a ring of frost glows on the ground (the corners of Shikai Hyōketsu). */
export class FrostMarker implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.Mesh;
  readonly pos: THREE.Vector3;

  constructor(private g: Game, at: THREE.Vector3, readonly life = 12) {
    this.pos = new THREE.Vector3(at.x, groundY(g, at.x, at.y + 0.5, at.z) + 0.05, at.z);
    this.mesh = flakeMesh('#9FE4FF', 0.7);
    this.mesh.position.copy(this.pos);
    g.engine.gr.scene.add(this.mesh);
    frostWorld(g, this.pos.clone().setY(this.pos.y + 0.1), 0.7, 120);
  }

  update(dt: number, g: Game): void {
    if (this.done) return;
    this.t += dt;
    const m = this.mesh.material as THREE.MeshBasicMaterial;
    m.opacity = Math.min(1, this.t / 0.15) * (this.t > this.life - 1 ? Math.max(0, this.life - this.t) : 1) * (0.75 + Math.sin(this.t * 6) * 0.15);
    this.mesh.rotation.y = this.t * 0.4;
    if (Math.random() < 0.08) g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y + 0.05, z: this.pos.z, vx: 0, vy: 0.6, vz: 0, size: 0.12, sizeEnd: 0.02, life: 0.5, r: 0.85, g: 0.96, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    if (this.t >= this.life) this.done = true;
  }

  dispose(): void {
    (this.mesh.material as THREE.Material).dispose();
    this.mesh.removeFromParent();
  }
}

/**
 * Shikai Hyōketsu: the space between the markers frozen in an instant — walls of crystal rise round the box, and
 * everything inside it freezes: the fighters (held, and their powers shut off), the ground, the shots.
 */
export class FreezeBox implements Projectile {
  done = false;
  private t = 0;
  private fired = false;
  private mesh: THREE.InstancedMesh;
  private mat = crystalMaterial(0.85, 1.3);
  private posts: THREE.Vector3[] = [];

  constructor(private g: Game, readonly owner: Fighter, readonly min: THREE.Vector3, readonly max: THREE.Vector3, readonly o = { hold: 2.5, damage: 90, seal: 4 }) {
    // crystals along the four sides of the box, rising out of the ground
    const step = 0.8;
    const edge = (ax: number, az: number, bx: number, bz: number) => {
      const len = Math.hypot(bx - ax, bz - az);
      const n = Math.max(2, Math.ceil(len / step));
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const x = ax + (bx - ax) * u, z = az + (bz - az) * u;
        this.posts.push(new THREE.Vector3(x, groundY(g, x, max.y, z), z));
      }
    };
    edge(min.x, min.z, max.x, min.z);
    edge(max.x, min.z, max.x, max.z);
    edge(max.x, max.z, min.x, max.z);
    edge(min.x, max.z, min.x, min.z);
    this.mesh = new THREE.InstancedMesh(crystalGeometry(), this.mat, this.posts.length);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
    g.engine.gr.scene.add(this.mesh);
    g.sfx.play('crack', min.clone().lerp(max, 0.5), 1);
  }

  private contains(p: THREE.Vector3): boolean {
    return p.x >= this.min.x && p.x <= this.max.x && p.z >= this.min.z && p.z <= this.max.z && p.y >= this.min.y - 1 && p.y <= this.max.y + 1;
  }

  update(dt: number, g: Game): void {
    if (this.done) return;
    this.t += dt;
    if (!this.fired && this.t >= 0.28) {
      this.fired = true;
      const c = this.min.clone().lerp(this.max, 0.5);
      // the four worlds inside, frozen
      const span = Math.max(this.max.x - this.min.x, this.max.z - this.min.z);
      for (let x = this.min.x; x <= this.max.x + 0.01; x += 2.5)
        for (let z = this.min.z; z <= this.max.z + 0.01; z += 2.5) frostWorld(g, new THREE.Vector3(x, groundY(g, x, this.max.y, z) + 0.3, z), 1.6, 300);
      g.rejectNear(c, span * 0.75, this.owner, true);
      for (const o of g.enemiesOf(this.owner)) {
        if (o.dead || !this.contains(o.pos)) continue;
        g.addProjectile(new IcePrison(g, this.owner, o, this.o.hold, this.o.damage, 'block', 1.2));
        o.sealT = Math.max(o.sealT, this.o.seal);
        o.sealK = Math.max(o.sealK, 0.3);
      }
      for (let i = 0; i < 60; i++) {
        const p = _v.set(this.min.x + Math.random() * (this.max.x - this.min.x), this.min.y + Math.random() * 3, this.min.z + Math.random() * (this.max.z - this.min.z));
        g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: 0, vy: 0.4, vz: 0, size: 0.16, sizeEnd: 0.02, life: 0.9, r: 0.85, g: 0.96, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
      }
      g.engine.dust.spawn({ x: c.x, y: c.y + 0.5, z: c.z, vx: 0, vy: 0.5, vz: 0, size: span * 0.5, sizeEnd: span, life: 1, r: 0.92, g: 0.97, b: 1, alpha: 0.4, alphaEnd: 0, tex: TEX_PUFF });
      g.shake(0.6);
      g.hitstop(0.08);
      g.callout('四界氷結', 'SHIKAI HYŌKETSU', '#bfefff');
    }
    if (this.t >= 1.4) {
      this.done = true;
      for (let i = 0; i < this.posts.length; i += 3) g.addProjectile(new GlassShards(g, this.posts[i].clone().setY(this.posts[i].y + 1.2), new THREE.Vector3(0.4, 1.2, 0.4), 6, 2, 0.9, this.posts[i].y, ICE_TINT, 0.6));
    }
  }

  render(): void {
    const grow = Math.min(1, this.t / 0.25);
    const fade = this.t > 1.1 ? Math.max(0, 1 - (this.t - 1.1) / 0.3) : 1;
    this.posts.forEach((p, i) => {
      const h = (2.6 + ((i * 7) % 5) * 0.35) * grow * fade;
      _q.identity();
      _s.set(0.7, h, 0.7);
      _m.compose(_v.copy(p).setY(p.y + h * 0.4), _q, _s);
      this.mesh.setMatrixAt(i, _m);
    });
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mat.dispose();
  }
}

/** The flash-freeze gesture: the target frozen where it stands, and every enemy shot along the line stopped dead. */
export function flashFreeze(g: Game, owner: Fighter, target: Fighter, hold = 1.6, damage = 40): void {
  const to = target.center();
  g.addProjectile(new StillAir(g, owner, target));
  g.addProjectile(new IcePrison(g, owner, target, hold, damage, 'block', 1.1));
  for (let i = 0; i < 24; i++) {
    const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.3) * 2;
    g.engine.glow.spawn({ x: to.x, y: to.y, z: to.z, vx: Math.cos(a) * 4, vy: e * 3, vz: Math.sin(a) * 4, size: 0.14, sizeEnd: 0.02, life: 0.5, r: 0.85, g: 0.96, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2, drag: 3 });
  }
  g.sfx.play('crack', to, 1);
}

/**
 * The air between his open hand and the target, frozen still for as long as the hand stays out: every enemy shot in
 * it stops dead (rejected), checked each frame along the line and widening toward the target like a cone.
 */
class StillAir implements Projectile {
  done = false;
  private t = 0;
  constructor(private g: Game, private owner: Fighter, private target: Fighter, private life = 0.45) {}
  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.t > this.life || this.owner.dead) {
      this.done = true;
      return;
    }
    const from = this.owner.center(_v);
    const to = this.target.center(_w);
    const n = Math.max(2, Math.ceil(from.distanceTo(to) / 2.5));
    for (let i = 1; i <= n; i++) {
      const u = i / n;
      const p = from.clone().lerp(to, u);
      g.rejectNear(p, 1.4 + u * 1.8, this.owner, false);
      if (Math.random() < 0.08) g.engine.glow.spawn({ x: p.x + (Math.random() - 0.5) * 1.5, y: p.y + (Math.random() - 0.5) * 1.5, z: p.z + (Math.random() - 0.5) * 1.5, size: 0.08, sizeEnd: 0.01, life: 0.4, r: 0.85, g: 0.96, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
  }
  dispose(): void {}
}

/** a carve that splits whatever was frozen on the Freeze-Cut's plane */
export function freezeCutCarve(g: Game, at: THREE.Vector3, dir: THREE.Vector3, len: number): void {
  const side = new THREE.Vector3().crossVectors(dir, UP).normalize();
  _m.makeBasis(side, UP, dir);
  _q.setFromRotationMatrix(_m);
  g.engine.destruction.carve(new BoxShape(at.clone().addScaledVector(dir, len / 2), new THREE.Vector3(len * 0.35, 0.1, len / 2), _q.clone()), { mode: 'cut', power: 1400, dir: dir.clone(), sparks: [0.75, 0.93, 1], dust: 0.4 });
  for (let d = 2; d < len; d += 3) frostWorld(g, at.clone().addScaledVector(dir, d), 1.4, 260);
}
