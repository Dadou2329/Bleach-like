// Quincy weapons. ReishiArrow: Heilig Pfeil — a thin bolt of blue light, very fast; it bursts on what it
// strikes (Letzt Stil arrows burst far harder) or, charged, bores straight through walls and fighters.
// GinreiBow: Ginrei Kojaku, the spider-web bow of light round the left fist. Sprenger: five Seele Schneider
// stuck in a pentagon round the target, the lines of light between them, the target's legs bound, then the
// Gintō poured and the whole pentagon going up. Gritz: a thrown Gintō spreads into a man-sized pentagonal
// cross that wraps the target. SeeleShot: Seele Schneider loosed from the bow, boring through everything.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { CapsuleShape, SphereShape } from '../destruction/shapes';
import { raycastVoxels } from '../voxel/raycast';
import { PropMesh } from '../game/characterFactory';
import { uryuProp } from '../chars/uryu';
import { groundAt } from './iceArts';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const Z = new THREE.Vector3(0, 0, 1);

// ------------------------------------------------------------------ Heilig Pfeil

export interface ArrowOpts {
  damage: number;
  speed?: number;
  /** burst radius on impact (0 = a clean hole) */
  burst?: number;
  /** bores through walls and fighters, carving a tunnel */
  pierce?: number;
  /** drawn thicker (charged shots) */
  size?: number;
  range?: number;
  quiet?: boolean;
  color?: THREE.ColorRepresentation;
  /** called where it bursts (Yhwach's arrows open into a Zeichen) */
  onBurst?: (p: THREE.Vector3, dir: THREE.Vector3) => void;
  /** the Blood War arrow: a broad head and a Zeichen-shaped tail with bent-back arms (Heilig Bogen) */
  zeichen?: boolean;
}

let arrowGeo: THREE.BufferGeometry | null = null;
let heiligGeo: THREE.BufferGeometry | null = null;

function mergeGeos(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const pos: number[] = [];
  for (const gg of parts) pos.push(...((gg.index ? gg.toNonIndexed() : gg).attributes.position.array as Float32Array));
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return merged;
}

/** A Heilig Pfeil of the Blood War: a thin shaft, a broad diamond head, five arms at the tail bent back. Along +Z. */
function heiligGeometry(): THREE.BufferGeometry {
  if (heiligGeo) return heiligGeo;
  const parts: THREE.BufferGeometry[] = [];
  const shaft = new THREE.CylinderGeometry(0.016, 0.012, 0.95, 5, 1, true);
  shaft.translate(0, -0.47, 0);
  parts.push(shaft);
  const head = new THREE.ConeGeometry(0.075, 0.24, 4);
  head.translate(0, 0.12, 0);
  parts.push(head);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    // an arm out from the tail, then bent back along the shaft
    const out = new THREE.BoxGeometry(0.012, 0.012, 0.11);
    out.translate(0, 0, 0.055);
    out.rotateY(a);
    out.translate(0, -0.86, 0);
    const back = new THREE.BoxGeometry(0.012, 0.09, 0.012);
    back.translate(Math.sin(a) * 0.11, -0.9, Math.cos(a) * 0.11);
    parts.push(out, back);
  }
  heiligGeo = mergeGeos(parts);
  heiligGeo.rotateX(Math.PI / 2);
  return heiligGeo;
}

export class ReishiArrow implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  readonly dir: THREE.Vector3;
  private mesh: THREE.Mesh;
  private travelled = 0;
  private hit = new Set<number>();
  private col: THREE.Color;

  constructor(private owner: Fighter, g: Game, origin: THREE.Vector3, dir: THREE.Vector3, readonly o: ArrowOpts) {
    this.pos = origin.clone();
    this.dir = dir.clone().normalize();
    this.col = new THREE.Color(o.color ?? '#59B7EE');
    if (!arrowGeo && !o.zeichen) {
      // a needle of light: a long thin shaft and a bright diamond head
      const shaft = new THREE.CylinderGeometry(0.018, 0.012, 0.9, 6, 1, true);
      shaft.translate(0, -0.45, 0);
      const head = new THREE.ConeGeometry(0.05, 0.16, 6);
      head.translate(0, 0.08, 0);
      const merged = new THREE.BufferGeometry();
      const pos: number[] = [];
      for (const gg of [shaft.toNonIndexed(), head.toNonIndexed()]) pos.push(...(gg.attributes.position.array as Float32Array));
      merged.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      merged.rotateX(Math.PI / 2);
      arrowGeo = merged;
    }
    this.mesh = new THREE.Mesh(o.zeichen ? heiligGeometry() : arrowGeo!, new THREE.MeshBasicMaterial({ color: this.col.clone().multiplyScalar(2.4), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.mesh.scale.setScalar(o.size ?? 1);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 7;
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number, g: Game): void {
    const o = this.o;
    const step = (o.speed ?? 110) * dt;
    if (!o.pierce) {
      const hit = raycastVoxels(g.engine.world, this.pos.x, this.pos.y, this.pos.z, this.dir.x, this.dir.y, this.dir.z, step);
      if (hit) {
        this.pos.addScaledVector(this.dir, hit.dist);
        this.burst(g, null);
        return;
      }
    } else {
      // charged: bore a tunnel through whatever is in the way
      const a = this.pos.clone(), b = this.pos.clone().addScaledVector(this.dir, step);
      g.engine.destruction.carve(new CapsuleShape(a, b, o.pierce), { mode: 'bore', power: 400, dir: this.dir.clone(), sparks: [0.6, 0.85, 1], dust: 0.2 });
    }
    for (const f of g.enemiesOf(this.owner)) {
      if (this.hit.has(f.id)) continue;
      // swept test along this step
      const to = _v.subVectors(f.center(), this.pos);
      const along = Math.max(0, Math.min(step, to.dot(this.dir)));
      const p = this.pos.clone().addScaledVector(this.dir, along);
      const cy = Math.max(f.pos.y + 0.15, Math.min(f.pos.y + f.def.height - 0.15, p.y));
      if (Math.hypot(f.pos.x - p.x, cy - p.y, f.pos.z - p.z) > f.def.radius + 0.12 + (o.pierce ?? 0) * 0.5) continue;
      this.hit.add(f.id);
      g.damage(f, o.damage, this.owner, new THREE.Vector3(this.dir.x, 0, this.dir.z).normalize(), { energy: true, knock: o.pierce ? 10 : 3 + (o.burst ?? 0) * 3, launch: o.pierce ? 3 : 0.5, heavy: !!o.pierce || (o.burst ?? 0) > 1.2, hitstop: o.quiet ? 0 : 0.03, shake: o.quiet ? 0 : 0.1, quiet: o.quiet, color: '#59B7EE' });
      if (!o.pierce) {
        this.pos.copy(p);
        this.burst(g, f);
        return;
      }
    }
    this.pos.addScaledVector(this.dir, step);
    this.travelled += step;
    g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: -this.dir.x * 4, vy: -this.dir.y * 4, vz: -this.dir.z * 4, size: 0.12 * (o.size ?? 1), sizeEnd: 0.02, life: 0.12, r: this.col.r, g: this.col.g, b: this.col.b, alpha: 0.8, alphaEnd: 0, tex: TEX_STREAK, stretch: 4 });
    if (this.travelled > (o.range ?? 110)) {
      if (o.pierce) this.done = true;
      else this.burst(g, null);
    }
  }

  render(): void {
    this.mesh.position.copy(this.pos);
    _q.setFromUnitVectors(Z, this.dir);
    this.mesh.quaternion.copy(_q);
  }

  /** an enemy rejection field or barrier undoes it */
  reject(at: THREE.Vector3, radius: number, by: Fighter): boolean {
    if (by === this.owner || this.done || this.pos.distanceTo(at) > radius) return false;
    this.done = true;
    this.mesh.visible = false;
    return true;
  }

  private burst(g: Game, f: Fighter | null): void {
    if (this.done) return;
    this.done = true;
    const p = this.pos, r = this.o.burst ?? 0;
    this.o.onBurst?.(p, this.dir);
    if (r > 0) {
      g.engine.destruction.carve(new SphereShape(p.clone(), r, 0.9), { mode: 'explode', power: 60 + r * 80, impulse: 6 + r * 3 });
      for (const e of g.enemiesOf(this.owner)) {
        if (e === f) continue;
        const d = e.center().distanceTo(p);
        if (d < r + e.def.radius) g.damage(e, this.o.damage * 0.5, this.owner, e.pos.clone().sub(p).setY(0).normalize(), { energy: true, knock: 6, launch: 2, quiet: this.o.quiet });
      }
      if (r > 1) g.sfx.play('explode', p, Math.min(1.4, 0.4 + r * 0.3));
    } else g.engine.destruction.carve(new SphereShape(p.clone(), 0.22), { mode: 'bore', power: 120 });
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.3 + r, sizeEnd: 1 + r * 2.2, life: 0.16 + r * 0.05, r: 0.7, g: 0.9, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    for (let i = 0; i < 6 + r * 6; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 6 - this.dir.x * 3, vy: Math.random() * 5, vz: Math.sin(a) * 6 - this.dir.z * 3, size: 0.07, sizeEnd: 0.02, life: 0.3, r: 0.6, g: 0.86, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2.5, gravity: -5 });
    }
    this.mesh.visible = false;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    (this.mesh.material as THREE.Material).dispose();
  }
}

// ------------------------------------------------------------------ Ginrei Kojaku

/** The spider-web bow of light round the left fist: radial spokes and rings, facing the way he faces. */
export class GinreiBow implements Projectile {
  done = false;
  /** 0 = gone, 1 = fully formed (the kit eases it) */
  level = 0;
  private lines: THREE.LineSegments;
  private glow: THREE.Sprite | null = null;
  private mat: THREE.LineBasicMaterial;

  constructor(g: Game, private owner: Fighter, private at: () => THREE.Vector3, public radius = 0.62) {
    const pos: number[] = [];
    const spokes = 10, rings = [0.3, 0.55, 0.8, 1];
    for (let i = 0; i < spokes; i++) {
      const a = (i / spokes) * Math.PI * 2;
      pos.push(0, 0, 0, Math.cos(a), Math.sin(a), 0);
    }
    for (const r of rings)
      for (let i = 0; i < spokes; i++) {
        const a0 = (i / spokes) * Math.PI * 2, a1 = ((i + 1) / spokes) * Math.PI * 2;
        // the web sags a little between spokes
        const s = r * 0.93;
        const am = (a0 + a1) / 2;
        pos.push(Math.cos(a0) * r, Math.sin(a0) * r, 0, Math.cos(am) * s, Math.sin(am) * s, 0);
        pos.push(Math.cos(am) * s, Math.sin(am) * s, 0, Math.cos(a1) * r, Math.sin(a1) * r, 0);
      }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    this.mat = new THREE.LineBasicMaterial({ color: new THREE.Color('#D1F2F7').multiplyScalar(1.8), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    this.lines = new THREE.LineSegments(geo, this.mat);
    this.lines.frustumCulled = false;
    this.lines.renderOrder = 7;
    g.engine.gr.scene.add(this.lines);
  }

  update(): void {}

  render(): void {
    const k = this.level;
    this.lines.visible = k > 0.02 && !this.owner.dead;
    if (!this.lines.visible) return;
    const p = this.at();
    this.lines.position.copy(p);
    // the web stands across the line of fire
    this.lines.rotation.set(0, this.owner.yaw, 0);
    this.lines.scale.setScalar(this.radius * (0.6 + 0.4 * k));
    this.mat.opacity = 0.85 * k;
  }

  dispose(): void {
    this.lines.removeFromParent();
    this.lines.geometry.dispose();
    this.mat.dispose();
    this.glow?.removeFromParent();
  }
}

// ------------------------------------------------------------------ Seele Schneider fired

/** Seele Schneider loosed from the bow: the blade itself flies, boring through walls and fighters. */
export class SeeleShot implements Projectile {
  done = false;
  private mesh: PropMesh;
  private travelled = 0;
  private hit = new Set<number>();
  readonly pos: THREE.Vector3;
  readonly dir: THREE.Vector3;

  constructor(private owner: Fighter, g: Game, origin: THREE.Vector3, dir: THREE.Vector3, readonly damage = 64) {
    this.pos = origin.clone();
    this.dir = dir.clone().normalize();
    this.mesh = new PropMesh(uryuProp('seele'));
    g.engine.gr.scene.add(this.mesh);
    g.sfx.play('getsuga', origin, 0.8);
  }

  update(dt: number, g: Game): void {
    const step = 75 * dt;
    const a = this.pos.clone(), b = this.pos.clone().addScaledVector(this.dir, step);
    g.engine.destruction.carve(new CapsuleShape(a, b, 0.45), { mode: 'bore', power: 520, dir: this.dir.clone(), sparks: [0.6, 0.9, 1], dust: 0.2 });
    for (const f of g.enemiesOf(this.owner)) {
      if (this.hit.has(f.id)) continue;
      const to = _v.subVectors(f.center(), this.pos);
      const along = Math.max(0, Math.min(step, to.dot(this.dir)));
      const p = this.pos.clone().addScaledVector(this.dir, along);
      if (p.distanceTo(f.center()) > f.def.radius + 0.6) continue;
      this.hit.add(f.id);
      g.damage(f, this.damage, this.owner, new THREE.Vector3(this.dir.x, 0, this.dir.z).normalize(), { energy: true, knock: 12, launch: 3, heavy: true, hitstop: 0.1, shake: 0.4, color: '#9FE6FF' });
      g.sparks(f.center(), this.dir, '#9FE6FF', 16);
    }
    this.pos.copy(b);
    this.travelled += step;
    g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: -this.dir.x * 6, vy: -this.dir.y * 6, vz: -this.dir.z * 6, size: 0.4, sizeEnd: 0.05, life: 0.2, r: 0.62, g: 0.9, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 4 });
    if (this.travelled > 120) this.done = true;
  }

  render(): void {
    this.mesh.position.copy(this.pos);
    _q.setFromUnitVectors(Z, this.dir);
    this.mesh.quaternion.copy(_q);
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.material.dispose();
  }
}

// ------------------------------------------------------------------ Sprenger

/** Five Seele Schneider stuck round the target in a pentagon; the legs bound; then the Gintō, and the blast. */
export class Sprenger implements Projectile {
  done = false;
  private t = 0;
  private blades: PropMesh[] = [];
  private spots: THREE.Vector3[] = [];
  private flying: { from: THREE.Vector3; t0: number }[] = [];
  private lines: THREE.LineLoop;
  private lineMat: THREE.LineBasicMaterial;
  private lit = 0;
  private blasted = false;
  readonly center: THREE.Vector3;

  constructor(private g: Game, private owner: Fighter, readonly target: Fighter, readonly radius = 3.2, readonly damage = 150) {
    this.center = target.pos.clone();
    this.center.y = groundAt(g, this.center.x, this.center.y + 1, this.center.z, 6) ?? this.center.y;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(new Array(15).fill(0), 3));
    this.lineMat = new THREE.LineBasicMaterial({ color: new THREE.Color('#8FE3FF').multiplyScalar(2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    this.lines = new THREE.LineLoop(geo, this.lineMat);
    this.lines.frustumCulled = false;
    g.engine.gr.scene.add(this.lines);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      this.spots.push(new THREE.Vector3(this.center.x + Math.cos(a) * radius, this.center.y, this.center.z + Math.sin(a) * radius));
    }
  }

  /** Throw the next blade from `from` (the hand); it flies to its corner of the pentagon. */
  throwNext(from: THREE.Vector3): void {
    const i = this.blades.length;
    if (i >= 5) return;
    const m = new PropMesh(uryuProp('seele'));
    this.g.engine.gr.scene.add(m);
    this.blades.push(m);
    this.flying.push({ from: from.clone(), t0: this.t });
    this.g.sfx.play('swing', from, 0.6);
  }

  /** Pour the Gintō: the pentagon goes up. */
  pour(): void {
    this.lit = Math.max(this.lit, 0.01);
    this.blastAt = this.t + 0.12;
  }
  private blastAt = Infinity;

  /** Abandoned before the pour (he was knocked out of it): the blades go and the bind lets go. */
  fizzle(): void {
    if (this.blastAt === Infinity) this.done = true;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const tg = this.target;
    // once two blades stand in the ground the reishi between them binds the target's legs
    let landed = 0;
    for (const fl of this.flying) if (this.t - fl.t0 >= 0.18) landed++;
    if (landed >= 2 && !this.blasted && !tg.dead) {
      if (Math.hypot(tg.pos.x - this.center.x, tg.pos.z - this.center.z) < this.radius + 0.5) {
        tg.body.vel.x = 0;
        tg.body.vel.z = 0;
        tg.push.set(0, 0, 0);
        tg.hitstun = Math.max(tg.hitstun, 0.2);
      }
    }
    if (!this.blasted && this.t >= this.blastAt) this.blast(g);
    if (this.blasted && this.t > this.blastAt + 0.8) this.done = true;
    if (this.t > 12) this.done = true;
  }

  private blast(g: Game): void {
    this.blasted = true;
    const c = this.center;
    for (const f of g.enemiesOf(this.owner)) {
      if (Math.hypot(f.pos.x - c.x, f.pos.z - c.z) > this.radius + f.def.radius + 0.6) continue;
      g.damage(f, this.damage, this.owner, new THREE.Vector3(0, 1, 0), { energy: true, knock: 4, launch: 12, heavy: true, hitstop: 0.16, shake: 0.7, color: '#F2EDB1' });
    }
    g.engine.destruction.carve(new SphereShape(c.clone().setY(c.y + 1), this.radius * 1.15, 0.8), { mode: 'explode', power: 420, impulse: 18 });
    g.addRing(c.clone(), this.radius * 4, '#F2EDB1', 0.6);
    g.sfx.play('explode', c, 2);
    g.shake(0.6);
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * this.radius;
      g.engine.glow.spawn({ x: c.x + Math.cos(a) * r, y: c.y + 0.3, z: c.z + Math.sin(a) * r, vx: Math.cos(a) * 2, vy: 6 + Math.random() * 14, vz: Math.sin(a) * 2, size: 0.8, sizeEnd: 2.4, life: 0.6, r: 1, g: 0.95, b: 0.75, alpha: 0.85, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    }
    g.engine.glow.spawn({ x: c.x, y: c.y + 1.5, z: c.z, size: this.radius * 2, sizeEnd: this.radius * 5, life: 0.35, r: 1, g: 1, b: 0.9, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    for (const m of this.blades) m.visible = false;
  }

  render(): void {
    const t = this.t;
    let landed = 0;
    for (let i = 0; i < this.blades.length; i++) {
      const m = this.blades[i];
      const fl = this.flying[i];
      const k = Math.min(1, (t - fl.t0) / 0.18);
      const end = this.spots[i].clone().add(new THREE.Vector3(0, 0.5, 0));
      const p = new THREE.Vector3().lerpVectors(fl.from, end, k);
      p.y += Math.sin(k * Math.PI) * 1.2;
      m.position.copy(p);
      // stuck point-down into the ground once landed
      const dir = k < 1 ? new THREE.Vector3().subVectors(end, fl.from).normalize() : new THREE.Vector3(0, -1, 0.05).normalize();
      _q.setFromUnitVectors(Z, dir);
      m.quaternion.copy(_q);
      if (k >= 1) landed++;
    }
    // the lines of light between the landed blades
    const pos = this.lines.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < 5; i++) {
      // a pentagram: each corner to the one two along
      const s = this.spots[(i * 2) % 5];
      pos.setXYZ(i, s.x, s.y + 0.08, s.z);
    }
    pos.needsUpdate = true;
    this.lineMat.opacity = this.blasted ? Math.max(0, 0.9 - (t - this.blastAt) * 2) : landed >= 5 ? 0.9 : 0;
  }

  dispose(): void {
    for (const m of this.blades) {
      m.removeFromParent();
      m.material.dispose();
    }
    this.lines.removeFromParent();
    this.lines.geometry.dispose();
    this.lineMat.dispose();
  }
}

// ------------------------------------------------------------------ Gintō: Gritz

/** Gritz: a man-sized pentagonal cross of light wrapped round the target, holding it fast. */
export class Gritz implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.LineLoop;
  private mat: THREE.LineBasicMaterial;
  private hold = new THREE.Vector3();
  private hitDone = false;

  constructor(private g: Game, private owner: Fighter, readonly target: Fighter, readonly dur = 1.8) {
    const pts: number[] = [];
    // a pentagram star outline, 1 unit across
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 === 0 ? 1 : 0.4;
      pts.push(Math.cos(a) * r, Math.sin(a) * r, 0);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.mat = new THREE.LineBasicMaterial({ color: new THREE.Color('#8FE3FF').multiplyScalar(2.2), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    this.mesh = new THREE.LineLoop(geo, this.mat);
    this.mesh.frustumCulled = false;
    g.engine.gr.scene.add(this.mesh);
    this.hold.copy(target.pos);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const tg = this.target;
    if (!this.hitDone) {
      this.hitDone = true;
      g.damage(tg, 12, this.owner, new THREE.Vector3(), { knock: 0, hitstop: 0.06, color: '#8FE3FF' });
      g.sfx.play('ting', tg.center(), 1);
    }
    if (!tg.dead && this.t < this.dur) {
      tg.body.pos.x = this.hold.x;
      tg.body.pos.z = this.hold.z;
      tg.body.vel.set(0, Math.min(0, tg.body.vel.y), 0);
      tg.push.set(0, 0, 0);
      tg.hitstun = Math.max(tg.hitstun, 0.25);
    }
    if (this.t > this.dur + 0.2 || tg.dead) this.done = true;
  }

  render(): void {
    const tg = this.target;
    const c = tg.center();
    this.mesh.position.copy(c);
    const cam = this.g.engine.gr.camera.position;
    this.mesh.lookAt(cam.x, c.y, cam.z);
    this.mesh.scale.setScalar(tg.def.height * 0.6 * Math.min(1, this.t / 0.1));
    this.mat.opacity = this.t > this.dur ? Math.max(0, 0.95 - (this.t - this.dur) * 5) : 0.95;
    if (Math.random() < 0.4) this.g.engine.glow.spawn({ x: c.x + (Math.random() - 0.5) * 0.8, y: c.y + (Math.random() - 0.5) * 1.2, z: c.z + (Math.random() - 0.5) * 0.8, size: 0.08, sizeEnd: 0.02, life: 0.25, r: 0.6, g: 0.9, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}

/** A Gintō tube flicked at the target: a silver glint flying in, then `onArrive` (the spell takes). */
export class GintoToss implements Projectile {
  done = false;
  private pos: THREE.Vector3;
  private t = 0;

  constructor(from: THREE.Vector3, readonly target: Fighter, private onArrive: () => void, readonly speed = 42) {
    this.pos = from.clone();
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const to = this.target.center();
    const d = _v.subVectors(to, this.pos);
    const len = d.length();
    const step = this.speed * dt;
    if (len <= step + 0.3 || this.target.dead || this.t > 2) {
      this.done = true;
      if (!this.target.dead) this.onArrive();
      return;
    }
    // a little arc: rises early, homes late
    d.multiplyScalar(step / len);
    d.y += Math.max(0, 0.25 - this.t) * 6 * dt;
    this.pos.add(d);
    g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, size: 0.14, sizeEnd: 0.03, life: 0.16, r: 0.85, g: 0.88, b: 0.92, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    if (Math.random() < 0.6) g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5, vz: (Math.random() - 0.5) * 1.5, size: 0.05, sizeEnd: 0.01, life: 0.3, r: 0.36, g: 0.75, b: 0.94, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  }

  dispose(): void {}
}

/** A puff of blue reishi under the feet (Hirenkyaku). */
export function hirenkyakuPuff(g: Game, p: THREE.Vector3): void {
  for (let i = 0; i < 8; i++) {
    const a = Math.random() * Math.PI * 2;
    g.engine.glow.spawn({ x: p.x, y: p.y + 0.05, z: p.z, vx: Math.cos(a) * 3, vy: Math.random(), vz: Math.sin(a) * 3, size: 0.2, sizeEnd: 0.6, life: 0.35, r: 0.56, g: 0.82, b: 1, alpha: 0.7, alphaEnd: 0, tex: TEX_PUFF, drag: 3 });
  }
}

export { UP };
