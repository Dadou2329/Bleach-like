// Uryū's Blood War effects (docs/kits/uryu.md). HeiligBogen: the bow of light in his left hand, its string drawn to
// the right hand. AntithesisLink: the two points lit and joined by a red thread, the reversal's flash; eyeCrackle: his
// eyes flash red. ScherbenChip: a Leiden Scherben chip set into a surface; it looses arrows at an enemy that passes
// and, at his snap, dissolves the reishi round it (no rubble). StandspitzeShot: the Still-Silver arrowhead on a shaft
// of light. FlechetteSwarm / FlechetteShot: the Vollständig flechettes orbiting him, and loosed. Sternenstaub: the
// giant star-tipped arrow that bores through everything. ReishiCage: the pentagon-panelled orb that closes round the
// target and goes up in a Zeichen. Federzwinger: five flechette rods rained round the target, the pentagonal cage
// between them. IcosahedronBarrier: the shell round him, its panels unfolded to fire converging beams. LightPillar:
// the Vollständig's pillar of light. ShadowPool: the Schatten he sinks into and steps out of. sklaverei(): the world
// round him torn into reishi that streams into him.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { CapsuleShape, SphereShape } from '../destruction/shapes';
import { raycastVoxels } from '../voxel/raycast';
import { PropMesh } from '../game/characterFactory';
import { BOGEN_TIP_Y, BOGEN_TIP_Z, uryuTybwProp } from '../chars/uryuTybw';
import { ReishiArrow } from './quincy';
import { zeichenBurst } from './almighty';
import { groundAt } from './iceArts';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

/** Heilig Pfeil cyan, light, core, deep; the Vollständig crystal and its edges; Antithesis red; Still Silver; vein blue */
export const PFEIL_CYAN = '#14C1F3';
export const PFEIL_LIGHT = '#47E2F8';
export const PFEIL_CORE = '#85F4FA';
export const PFEIL_DEEP = '#0554B8';
export const CRYSTAL = '#8FE9F8';
export const CRYSTAL_EDGE = '#1E8FD0';
export const ANTI_RED = '#FF2A3A';
export const STILL_SILVER = '#D8DDE6';
export const VENE_BLUE = '#6FA8FF';

const UP = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const CRY = new THREE.Color(CRYSTAL);
const CORE = new THREE.Color(PFEIL_CORE);
const RED = new THREE.Color(ANTI_RED);

function ground(g: Game, p: THREE.Vector3): number {
  return groundAt(g, p.x, p.y + 2, p.z, 12) ?? p.y;
}

function additive(color: THREE.ColorRepresentation, k = 2, opacity = 0.9): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
}

/** swept sphere test along a step: the fighter's nearest point to the segment, within r */
function sweptHit(f: Fighter, p: THREE.Vector3, dir: THREE.Vector3, step: number, r: number): boolean {
  const to = _v.subVectors(f.center(), p);
  const along = Math.max(0, Math.min(step, to.dot(dir)));
  const q = _w.copy(p).addScaledVector(dir, along);
  const cy = Math.max(f.pos.y + 0.15, Math.min(f.pos.y + f.def.height - 0.15, q.y));
  return Math.hypot(f.pos.x - q.x, cy - q.y, f.pos.z - q.z) <= f.def.radius + r;
}

// ------------------------------------------------------------------ the Heilig Bogen

/** The bow of light in his left fist while he shoots; the string from tip to tip through the drawing hand. */
export class HeiligBogen implements Projectile {
  done = false;
  /** 0 = gone, 1 = fully formed (the kit eases it) */
  level = 0;
  /** 0 = slack, 1 = drawn to the right hand */
  draw = 0;
  private mesh: PropMesh;
  private line: THREE.Line;
  private lineMat: THREE.LineBasicMaterial;
  private pts = new Float32Array(9);
  private basisX = new THREE.Vector3();
  private basisY = new THREE.Vector3();

  constructor(g: Game, private owner: Fighter, private at: () => THREE.Vector3, private hand: () => THREE.Vector3, private aimAt: () => THREE.Vector3) {
    this.mesh = new PropMesh(uryuTybwProp('bogen'));
    this.mesh.castShadow = false;
    this.mesh.visible = false;
    g.engine.gr.scene.add(this.mesh);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pts, 3));
    this.lineMat = new THREE.LineBasicMaterial({ color: CORE.clone().multiplyScalar(1.8), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    this.line = new THREE.Line(geo, this.lineMat);
    this.line.frustumCulled = false;
    this.line.renderOrder = 7;
    this.line.visible = false;
    g.engine.gr.scene.add(this.line);
  }

  update(): void {}

  render(): void {
    const k = this.level;
    const vis = k > 0.02 && !this.owner.dead;
    this.mesh.visible = this.line.visible = vis;
    if (!vis) return;
    const p = this.at();
    const fwd = this.aimAt().sub(p);
    if (fwd.lengthSq() < 1e-4) this.owner.forward(fwd);
    fwd.normalize();
    // the bow stands across the line of fire (+X its left, +Y up), canted a little, the top toward his right
    const x = this.basisX.crossVectors(UP, fwd);
    if (x.lengthSq() < 1e-4) x.set(1, 0, 0);
    x.normalize();
    const y = this.basisY.crossVectors(fwd, x).normalize();
    const cant = 0.17;
    const yc = _a.copy(y).multiplyScalar(Math.cos(cant)).addScaledVector(x, -Math.sin(cant));
    const xc = _b.crossVectors(yc, fwd).normalize();
    _m.makeBasis(xc, yc, fwd);
    this.mesh.quaternion.setFromRotationMatrix(_m);
    this.mesh.position.copy(p);
    const sc = 0.6 + 0.4 * k;
    this.mesh.scale.set(sc, k, sc);
    this.mesh.updateMatrixWorld();
    const top = _a.set(0, BOGEN_TIP_Y, BOGEN_TIP_Z).applyMatrix4(this.mesh.matrixWorld);
    const bot = _b.set(0, -BOGEN_TIP_Y, BOGEN_TIP_Z).applyMatrix4(this.mesh.matrixWorld);
    const nock = _c.set(0, 0, BOGEN_TIP_Z).applyMatrix4(this.mesh.matrixWorld).lerp(this.hand(), Math.min(1, this.draw));
    this.pts.set([top.x, top.y, top.z, nock.x, nock.y, nock.z, bot.x, bot.y, bot.z]);
    (this.line.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    this.lineMat.opacity = 0.9 * k;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.material.dispose();
    this.line.removeFromParent();
    this.line.geometry.dispose();
    this.lineMat.dispose();
  }
}

// ------------------------------------------------------------------ Antithesis

/** His eyes crackle and flash red. */
export function eyeCrackle(g: Game, f: Fighter): void {
  for (const n of ['eye.L', 'eye.R']) {
    const s = f.visual.rig.sockets.get(n);
    if (!s) continue;
    s.updateWorldMatrix(true, false);
    const p = s.getWorldPosition(_v);
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.16, sizeEnd: 0.05, life: 0.35, r: RED.r, g: RED.g, b: RED.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 1.4, vy: (Math.random() - 0.3) * 1.4, vz: Math.sin(a) * 1.4, size: 0.03, sizeEnd: 0.01, life: 0.2, r: 1, g: 0.3, b: 0.3, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
    }
  }
}

/**
 * The two points of Antithesis: him and the target, each lit, a red thread between them; at `swapAt` the reversal
 * (the kit's callback) and a flash at both ends.
 */
export class AntithesisLink implements Projectile {
  done = false;
  private t = 0;
  private swapped = false;
  private line: THREE.Line;
  private mat: THREE.LineBasicMaterial;
  private pts = new Float32Array(6);

  constructor(g: Game, private a: Fighter, private b: Fighter, private onSwap: () => void, readonly swapAt = 0.22, readonly dur = 0.8) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pts, 3));
    this.mat = new THREE.LineBasicMaterial({ color: RED.clone().multiplyScalar(2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    this.line = new THREE.Line(geo, this.mat);
    this.line.frustumCulled = false;
    this.line.renderOrder = 7;
    g.engine.gr.scene.add(this.line);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    for (const f of [this.a, this.b]) {
      const c = f.center();
      if (Math.random() < 0.7) g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 0.5 + Math.random() * 0.3, sizeEnd: 0.2, life: 0.1, r: 1, g: 0.25, b: 0.28, alpha: 0.6, alphaEnd: 0, tex: TEX_GLOW });
    }
    if (!this.swapped && this.t >= this.swapAt) {
      this.swapped = true;
      if (!this.a.dead && !this.b.dead) this.onSwap();
      for (const f of [this.a, this.b]) {
        const c = f.center();
        g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 1.6, sizeEnd: 3.2, life: 0.25, r: 1, g: 0.35, b: 0.38, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
        g.addRing(f.pos.clone().setY(f.pos.y + 0.1), 2.2, ANTI_RED, 0.4);
        for (let i = 0; i < 14; i++) {
          const ang = Math.random() * Math.PI * 2;
          g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: Math.cos(ang) * 6, vy: (Math.random() - 0.5) * 6, vz: Math.sin(ang) * 6, size: 0.08, sizeEnd: 0.02, life: 0.3, r: 1, g: 0.3, b: 0.32, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 3 });
        }
      }
      g.sfx.play('ting', this.b.center(), 1.2);
    }
    if (this.t >= this.dur) this.done = true;
  }

  render(): void {
    const a = this.a.center(_a), b = this.b.center(_b);
    this.pts.set([a.x, a.y, a.z, b.x, b.y, b.z]);
    (this.line.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    this.mat.opacity = this.swapped ? Math.max(0, 1 - (this.t - this.swapAt) / (this.dur - this.swapAt)) : 0.35 + 0.35 * Math.sin(this.t * 60);
  }

  dispose(): void {
    this.line.removeFromParent();
    this.line.geometry.dispose();
    this.mat.dispose();
  }
}

// ------------------------------------------------------------------ Leiden Scherben

/** A chip set into a surface: it looses arrows at an enemy that comes near; his snap dissolves the reishi round it. */
export class ScherbenChip implements Projectile {
  done = false;
  private mesh: PropMesh;
  private t = 0;

  constructor(private g: Game, private owner: Fighter, readonly pos: THREE.Vector3, normal: THREE.Vector3, readonly damage = 14, readonly reach = 2.5) {
    this.mesh = new PropMesh(uryuTybwProp('chip'));
    this.mesh.position.copy(pos);
    this.mesh.quaternion.setFromUnitVectors(UP, normal.clone().normalize());
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (Math.random() < dt * 2.5) g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y + 0.05, z: this.pos.z, size: 0.25, sizeEnd: 0.5, life: 0.4, r: CORE.r, g: CORE.g, b: CORE.b, alpha: 0.7, alphaEnd: 0, tex: TEX_GLOW });
    if (this.t < 0.5) return;
    for (const e of g.enemiesOf(this.owner)) {
      if (e.dead || e.center().distanceTo(this.pos) > this.reach + e.def.radius) continue;
      this.trip(e);
      return;
    }
  }

  /** an enemy passed: six arrows at it off the chip */
  private trip(e: Fighter): void {
    const g = this.g;
    for (let i = 0; i < 6; i++) {
      const from = this.pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.15 + Math.random() * 0.3, (Math.random() - 0.5) * 0.4));
      const to = e.center().add(new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.5));
      g.addProjectile(new ReishiArrow(this.owner, g, from, to.sub(from).normalize(), { damage: this.damage, speed: 90, zeichen: true, color: PFEIL_LIGHT, quiet: i > 0 }));
    }
    g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y + 0.2, z: this.pos.z, size: 0.8, sizeEnd: 1.6, life: 0.18, r: CORE.r, g: CORE.g, b: CORE.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    g.sfx.play('arrow', this.pos, 1);
    this.done = true;
  }

  /** the snap: the reishi round the chip comes apart (no rubble, it streams away) and whoever is close is blasted */
  detonate(dmg = 40): void {
    if (this.done) return;
    const g = this.g, p = this.pos;
    g.engine.destruction.carve(new SphereShape(p.clone(), 2.5, 0.85), { mode: 'erase', power: 900, dust: 0 });
    for (const e of g.enemiesOf(this.owner)) {
      if (e.center().distanceTo(p) < 3 + e.def.radius) g.damage(e, dmg, this.owner, e.pos.clone().sub(p).setY(0).normalize(), { energy: true, knock: 8, launch: 4, heavy: true, color: PFEIL_LIGHT });
    }
    for (let i = 0; i < 46; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * 2.4;
      g.engine.glow.spawn({ x: p.x + Math.cos(a) * r, y: p.y + (Math.random() - 0.3) * 2, z: p.z + Math.sin(a) * r, vx: Math.cos(a) * 0.6, vy: 3 + Math.random() * 5, vz: Math.sin(a) * 0.6, size: 0.12, sizeEnd: 0.03, life: 0.5 + Math.random() * 0.4, r: CORE.r, g: CORE.g, b: CORE.b, alpha: 0.95, alphaEnd: 0, tex: TEX_STREAK, stretch: 2.5 });
    }
    g.engine.glow.spawn({ x: p.x, y: p.y + 0.5, z: p.z, size: 2.5, sizeEnd: 5, life: 0.25, r: 0.7, g: 0.95, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    g.addRing(p.clone(), 3, PFEIL_LIGHT, 0.4);
    g.sfx.play('explode', p, 0.8);
    this.done = true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.material.dispose();
  }
}

// ------------------------------------------------------------------ the Standspitze

/** The Still-Silver arrowhead on a shaft of light: on a hit `onHit` seals the target's power. */
export class StandspitzeShot implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  readonly dir: THREE.Vector3;
  private mesh: PropMesh;
  private travelled = 0;

  constructor(private owner: Fighter, g: Game, origin: THREE.Vector3, dir: THREE.Vector3, private onHit: (t: Fighter) => void, readonly damage = 30) {
    this.pos = origin.clone();
    this.dir = dir.clone().normalize();
    this.mesh = new PropMesh(uryuTybwProp('standspitze'));
    this.mesh.castShadow = false;
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number, g: Game): void {
    const step = 62 * dt;
    const hit = raycastVoxels(g.engine.world, this.pos.x, this.pos.y, this.pos.z, this.dir.x, this.dir.y, this.dir.z, step);
    for (const f of g.enemiesOf(this.owner)) {
      if (f.dead || !sweptHit(f, this.pos, this.dir, hit ? hit.dist : step, 0.15)) continue;
      g.damage(f, this.damage, this.owner, new THREE.Vector3(this.dir.x, 0, this.dir.z).normalize(), { energy: true, knock: 6, heavy: true, hitstop: 0.12, shake: 0.3, color: STILL_SILVER });
      this.onHit(f);
      g.sparks(f.center(), this.dir, STILL_SILVER, 18);
      this.done = true;
      return;
    }
    if (hit) {
      this.pos.addScaledVector(this.dir, hit.dist);
      g.engine.destruction.carve(new SphereShape(this.pos.clone(), 0.3), { mode: 'bore', power: 300 });
      g.sparks(this.pos, this.dir.clone().negate(), STILL_SILVER, 10);
      this.done = true;
      return;
    }
    this.pos.addScaledVector(this.dir, step);
    this.travelled += step;
    g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: -this.dir.x * 5, vy: -this.dir.y * 5, vz: -this.dir.z * 5, size: 0.16, sizeEnd: 0.03, life: 0.2, r: 0.85, g: 0.88, b: 0.95, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 4 });
    g.engine.glow.spawn({ x: this.pos.x - this.dir.x * 0.5, y: this.pos.y - this.dir.y * 0.5, z: this.pos.z - this.dir.z * 0.5, size: 0.1, sizeEnd: 0.02, life: 0.12, r: CORE.r, g: CORE.g, b: CORE.b, alpha: 0.8, alphaEnd: 0, tex: TEX_STREAK, stretch: 5 });
    if (this.travelled > 140) this.done = true;
  }

  render(): void {
    this.mesh.position.copy(this.pos);
    this.mesh.quaternion.setFromUnitVectors(Z, this.dir);
  }

  reject(at: THREE.Vector3, radius: number, by: Fighter): boolean {
    if (by === this.owner || this.done || this.pos.distanceTo(at) > radius) return false;
    this.done = true;
    return true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.material.dispose();
  }
}

// ------------------------------------------------------------------ flechettes

let flechTemplate: PropMesh | null = null;
/** a flechette mesh sharing the template's geometry and material (never disposed) */
function flechetteMesh(): THREE.Mesh {
  if (!flechTemplate) flechTemplate = new PropMesh(uryuTybwProp('flechette'));
  const m = new THREE.Mesh(flechTemplate.geometry, flechTemplate.material);
  m.castShadow = false;
  return m;
}

/** The Vollständig flechettes: twelve riding two tilted, contra-rotating rings round him; loosed ones grow back. */
export class FlechetteSwarm implements Projectile {
  done = false;
  readonly max = 12;
  ready = 12;
  private meshes: THREE.Mesh[] = [];
  private regen = 0;
  private spin = 0;

  constructor(g: Game, private owner: Fighter, private centre: () => THREE.Vector3) {
    for (let i = 0; i < this.max; i++) {
      const m = flechetteMesh();
      m.visible = false;
      g.engine.gr.scene.add(m);
      this.meshes.push(m);
    }
  }

  update(dt: number): void {
    if (this.ready < this.max) {
      this.regen += dt;
      if (this.regen > 0.42) {
        this.regen = 0;
        this.ready++;
      }
    }
    this.spin += dt * 1.5;
  }

  /** where flechette i rides */
  slot(i: number, out: THREE.Vector3, ds = 0): THREE.Vector3 {
    const c = this.centre();
    const ring = i % 2, n = this.max / 2, j = Math.floor(i / 2);
    const a = (j / n) * Math.PI * 2 + (ring ? -(this.spin + ds) : this.spin + ds);
    const r = ring ? 1.3 : 1.05;
    const tilt = ring ? 0.35 : -0.25;
    return out.set(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r * tilt + (ring ? 0.3 : -0.15), c.z + Math.sin(a) * r);
  }

  render(): void {
    for (let i = 0; i < this.max; i++) {
      const m = this.meshes[i];
      m.visible = i < this.ready && !this.owner.dead;
      if (!m.visible) continue;
      this.slot(i, m.position);
      const ahead = this.slot(i, _v, 0.05).sub(m.position);
      if (ahead.lengthSq() > 1e-8) m.quaternion.setFromUnitVectors(Z, ahead.normalize());
    }
  }

  /** take up to n flechettes out of the orbit: where they were */
  take(n: number): THREE.Vector3[] {
    const out: THREE.Vector3[] = [];
    while (n-- > 0 && this.ready > 0) {
      this.ready--;
      out.push(this.slot(this.ready, new THREE.Vector3()));
    }
    this.regen = 0;
    return out;
  }

  dispose(): void {
    for (const m of this.meshes) m.removeFromParent();
  }
}

/** One flechette loosed: a beat turning toward the target, then a fast dart that homes a little. */
export class FlechetteShot implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  readonly dir: THREE.Vector3;
  private mesh: THREE.Mesh;
  private travelled = 0;

  constructor(private owner: Fighter, g: Game, from: THREE.Vector3, private target: Fighter | null, aim: THREE.Vector3, readonly damage = 9, private delay = 0, private quiet = false) {
    this.pos = from.clone();
    this.dir = aim.clone().sub(from).normalize();
    this.mesh = flechetteMesh();
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number, g: Game): void {
    if (this.delay > 0) {
      this.delay -= dt;
      if (this.target && !this.target.dead) this.dir.lerp(this.target.center().sub(this.pos).normalize(), Math.min(1, dt * 12)).normalize();
      return;
    }
    if (this.target && !this.target.dead && this.travelled < 40) this.dir.lerp(this.target.center().sub(this.pos).normalize(), Math.min(1, dt * 3)).normalize();
    const step = 92 * dt;
    const hit = raycastVoxels(g.engine.world, this.pos.x, this.pos.y, this.pos.z, this.dir.x, this.dir.y, this.dir.z, step);
    for (const f of g.enemiesOf(this.owner)) {
      if (f.dead || !sweptHit(f, this.pos, this.dir, hit ? hit.dist : step, 0.12)) continue;
      g.damage(f, this.damage, this.owner, new THREE.Vector3(this.dir.x, 0, this.dir.z).normalize(), { energy: true, knock: 2.5, quiet: this.quiet, hitstop: this.quiet ? 0 : 0.03, color: CRYSTAL });
      g.sparks(f.center(), this.dir, CRYSTAL, 5);
      this.done = true;
      return;
    }
    if (hit) {
      this.pos.addScaledVector(this.dir, hit.dist);
      g.engine.destruction.carve(new SphereShape(this.pos.clone(), 0.22), { mode: 'bore', power: 160 });
      g.sparks(this.pos, this.dir.clone().negate(), CRYSTAL, 4);
      this.done = true;
      return;
    }
    this.pos.addScaledVector(this.dir, step);
    this.travelled += step;
    g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: -this.dir.x * 4, vy: -this.dir.y * 4, vz: -this.dir.z * 4, size: 0.1, sizeEnd: 0.02, life: 0.12, r: CRY.r, g: CRY.g, b: CRY.b, alpha: 0.8, alphaEnd: 0, tex: TEX_STREAK, stretch: 4 });
    if (this.travelled > 100) this.done = true;
  }

  render(): void {
    this.mesh.position.copy(this.pos);
    this.mesh.quaternion.setFromUnitVectors(Z, this.dir);
  }

  reject(at: THREE.Vector3, radius: number, by: Fighter): boolean {
    if (by === this.owner || this.done || this.pos.distanceTo(at) > radius) return false;
    this.done = true;
    return true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
  }
}

// ------------------------------------------------------------------ Sternenstaub

let starGeo: THREE.BufferGeometry | null = null;
/** a flat five-pointed star, 1 m across the points, facing +Z */
function starGeometry(): THREE.BufferGeometry {
  if (starGeo) return starGeo;
  const sh = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 === 0 ? 0.5 : 0.21;
    if (i === 0) sh.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else sh.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  sh.closePath();
  starGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false });
  starGeo.translate(0, 0, -0.06);
  return starGeo;
}

/**
 * Sternenstaub: the flechettes merge into a giant arrow with a Zeichen star at its head — formed at his palm, or
 * far behind a distant target — that bores through everything and bursts at the end of its run.
 */
export class Sternenstaub implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  readonly dir: THREE.Vector3;
  private group = new THREE.Group();
  private star: THREE.Mesh;
  private mats: THREE.Material[] = [];
  private geos: THREE.BufferGeometry[] = [];
  private t = 0;
  private flying = false;
  private travelled = 0;
  private hit = new Set<number>();

  constructor(private g: Game, private owner: Fighter, at: THREE.Vector3, private target: Fighter | null, aim: THREE.Vector3, readonly formT = 0.67, readonly damage = 180, readonly bore = 1.6) {
    this.pos = at.clone();
    this.dir = aim.clone().sub(at).normalize();
    const body = additive(CRYSTAL, 2.2, 0.9), core = additive(PFEIL_CORE, 2.6, 0.95);
    this.mats.push(body, core);
    const shaft = new THREE.CylinderGeometry(0.14, 0.2, 5.4, 8);
    shaft.rotateX(Math.PI / 2);
    shaft.translate(0, 0, -2.9);
    const head = new THREE.ConeGeometry(0.42, 1.7, 6);
    head.rotateX(Math.PI / 2);
    head.translate(0, 0, 0.6);
    this.geos.push(shaft, head);
    this.group.add(new THREE.Mesh(shaft, body), new THREE.Mesh(head, core));
    // the Zeichen star behind the point, and the fletching at the tail: five fins
    this.star = new THREE.Mesh(starGeometry(), core);
    this.star.scale.setScalar(2.6);
    this.star.position.z = -0.3;
    this.group.add(this.star);
    for (let i = 0; i < 5; i++) {
      const fin = new THREE.BoxGeometry(0.05, 0.55, 1.1);
      fin.translate(0, 0.38, -5.2);
      fin.rotateZ((i / 5) * Math.PI * 2);
      this.geos.push(fin);
      this.group.add(new THREE.Mesh(fin, body));
    }
    this.group.scale.setScalar(0.01);
    for (const c of this.group.children) (c as THREE.Mesh).frustumCulled = false;
    g.engine.gr.scene.add(this.group);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (!this.flying) {
      // the flechettes stream into it from all round
      for (let i = 0; i < 5; i++) {
        const d = _v.set(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).normalize();
        const r = 4 + Math.random() * 3, life = 0.25;
        const q = _w.copy(this.pos).addScaledVector(d, r);
        g.engine.glow.spawn({ x: q.x, y: q.y, z: q.z, vx: -d.x * r / life, vy: -d.y * r / life, vz: -d.z * r / life, size: 0.14, sizeEnd: 0.06, life, r: CRY.r, g: CRY.g, b: CRY.b, alpha: 0.9, alphaEnd: 0.3, tex: TEX_STREAK, stretch: 3 });
      }
      if (this.target && !this.target.dead) this.dir.copy(this.target.center().sub(this.pos)).normalize();
      if (this.t >= this.formT) {
        this.flying = true;
        g.sfx.play('beam', this.pos, 1.3);
        g.shake(0.3);
      }
      return;
    }
    const step = 70 * dt;
    const a = this.pos.clone(), b = this.pos.clone().addScaledVector(this.dir, step);
    g.engine.destruction.carve(new CapsuleShape(a, b, this.bore), { mode: 'bore', power: 2500, dir: this.dir.clone(), sparks: [0.56, 0.91, 0.97], dust: 0.3 });
    for (const e of g.enemiesOf(this.owner)) {
      if (this.hit.has(e.id) || e.dead || !sweptHit(e, this.pos, this.dir, step, this.bore)) continue;
      this.hit.add(e.id);
      g.damage(e, this.damage, this.owner, new THREE.Vector3(this.dir.x, 0, this.dir.z).normalize(), { energy: true, heavy: true, knock: 18, launch: 6, hitstop: 0.16, shake: 0.6, color: CRYSTAL });
      g.sparks(e.center(), this.dir, CRYSTAL, 24);
    }
    for (let i = 0; i < 3; i++) {
      const r = (Math.random() - 0.5) * this.bore;
      g.engine.glow.spawn({ x: this.pos.x + r, y: this.pos.y + (Math.random() - 0.5) * this.bore, z: this.pos.z - r, vx: -this.dir.x * 8, vy: -this.dir.y * 8, vz: -this.dir.z * 8, size: 0.6, sizeEnd: 0.1, life: 0.3, r: CRY.r, g: CRY.g, b: CRY.b, alpha: 0.8, alphaEnd: 0, tex: TEX_STREAK, stretch: 4 });
    }
    this.pos.copy(b);
    this.travelled += step;
    if (this.travelled > 110 || this.pos.y < ground(g, this.pos) - 3) this.blast(g);
  }

  private blast(g: Game): void {
    if (this.done) return;
    const p = this.pos.clone();
    g.engine.destruction.carve(new SphereShape(p, 4, 0.9), { mode: 'explode', power: 1800, impulse: 12 });
    for (const e of g.enemiesOf(this.owner)) {
      if (!this.hit.has(e.id) && e.center().distanceTo(p) < 4.5 + e.def.radius) g.damage(e, this.damage * 0.35, this.owner, e.pos.clone().sub(p).setY(0).normalize(), { energy: true, heavy: true, knock: 12, launch: 5, color: CRYSTAL });
    }
    zeichenBurst(g, p, this.dir, 2.6, CRY);
    g.addRing(p.clone(), 6, CRYSTAL, 0.5);
    g.sfx.play('explode', p, 1.3);
    g.shake(0.4);
    this.done = true;
  }

  render(): void {
    this.group.position.copy(this.pos);
    this.group.quaternion.setFromUnitVectors(Z, this.dir);
    const k = this.flying ? 1 : Math.min(1, this.t / this.formT);
    this.group.scale.setScalar(Math.max(0.01, 1 - Math.pow(1 - k, 3)));
    this.star.rotation.z = this.t * 3;
  }

  reject(at: THREE.Vector3, radius: number, by: Fighter): boolean {
    if (by === this.owner || this.done || this.pos.distanceTo(at) > radius + this.bore) return false;
    this.done = true;
    return true;
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const m of this.mats) m.dispose();
    for (const g of this.geos) g.dispose();
  }
}

// ------------------------------------------------------------------ Reishi Cage

/** A pentagon-panelled orb closing round the target; it holds it, then goes up in a Quincy Zeichen. */
export class ReishiCage implements Projectile {
  done = false;
  private t = 0;
  private group = new THREE.Group();
  private geo = new THREE.DodecahedronGeometry(2, 0);
  private edgeGeo: THREE.EdgesGeometry;
  private edgeMat = new THREE.LineBasicMaterial({ color: CRY.clone().multiplyScalar(2), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
  private faceMat = additive(CRYSTAL, 1, 0.14);
  private holding = false;

  constructor(private g: Game, private owner: Fighter, readonly target: Fighter, readonly damage = 120, readonly closeT = 20 / 60, readonly blastT = 50 / 60) {
    this.edgeGeo = new THREE.EdgesGeometry(this.geo);
    const edges = new THREE.LineSegments(this.edgeGeo, this.edgeMat);
    const faces = new THREE.Mesh(this.geo, this.faceMat);
    edges.frustumCulled = faces.frustumCulled = false;
    this.group.add(faces, edges);
    g.engine.gr.scene.add(this.group);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const tg = this.target;
    if (tg.dead) {
      this.release();
      this.done = true;
      return;
    }
    if (this.t >= this.closeT && !this.holding) {
      this.holding = true;
      tg.rooted = true;
      g.sfx.play('ting', tg.center(), 0.8);
      g.addRing(tg.center(), 2.4, CRYSTAL, 0.3);
    }
    if (this.holding && Math.random() < 0.5) {
      const c = tg.center(), d = _v.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      g.engine.glow.spawn({ x: c.x + d.x * 2, y: c.y + d.y * 2, z: c.z + d.z * 2, size: 0.2, sizeEnd: 0.05, life: 0.2, r: CRY.r, g: CRY.g, b: CRY.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
    if (this.t >= this.blastT) this.blast(g);
  }

  private blast(g: Game): void {
    const tg = this.target, c = tg.center();
    this.release();
    g.engine.destruction.carve(new SphereShape(c.clone(), 3.5, 0.9), { mode: 'explode', power: 1400, impulse: 10 });
    const away = tg.pos.clone().sub(this.owner.pos).setY(0);
    if (away.lengthSq() < 1e-4) away.set(0, 0, 1);
    away.normalize();
    g.damage(tg, this.damage, this.owner, away, { energy: true, heavy: true, knock: 14, launch: 7, hitstop: 0.14, shake: 0.5, color: CRYSTAL });
    zeichenBurst(g, c, away, 2.2, CRY);
    g.addRing(tg.pos.clone(), 4.5, CRYSTAL, 0.45);
    g.sfx.play('explode', c, 1.1);
    this.done = true;
  }

  private release(): void {
    if (!this.holding) return;
    this.holding = false;
    this.target.rooted = false;
  }

  render(): void {
    this.group.position.copy(this.target.center(_v));
    const k = Math.min(1, this.t / this.closeT);
    const s = 2.8 - 1.8 * (1 - Math.pow(1 - k, 3));
    this.group.scale.setScalar(this.holding ? 1 - 0.04 * Math.sin(this.t * 40) : s);
    this.group.rotation.set(this.t * 0.7, this.t * 1.3, 0);
    this.faceMat.opacity = this.holding ? 0.14 + 0.1 * Math.min(1, (this.t - this.closeT) / (this.blastT - this.closeT)) : 0.08 * k;
  }

  dispose(): void {
    this.release();
    this.group.removeFromParent();
    this.geo.dispose();
    this.edgeGeo.dispose();
    this.edgeMat.dispose();
    this.faceMat.dispose();
  }
}

// ------------------------------------------------------------------ Federzwinger

/**
 * Federzwinger: five flechette rods rain down round the target in a pentagon; the cage of light between them holds it
 * (rooted), drains its reiatsu and seals its releases until the cage breaks (time, or the target driven out of it).
 */
export class Federzwinger implements Projectile {
  done = false;
  private t = 0;
  private rods: THREE.Mesh[] = [];
  private spots: THREE.Vector3[] = [];
  private centre: THREE.Vector3;
  private lines: THREE.LineSegments;
  private lineMat = new THREE.LineBasicMaterial({ color: CRY.clone().multiplyScalar(2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  private pts = new Float32Array(15 * 2 * 3);
  private holding = false;

  constructor(private g: Game, private owner: Fighter, readonly target: Fighter, readonly fallT = 0.3, readonly dur = 5, readonly drain = 8, readonly radius = 2.2) {
    this.centre = target.pos.clone();
    const a0 = Math.random() * Math.PI * 2;
    for (let i = 0; i < 5; i++) {
      const a = a0 + (i / 5) * Math.PI * 2;
      const s = new THREE.Vector3(this.centre.x + Math.cos(a) * radius, 0, this.centre.z + Math.sin(a) * radius);
      s.y = groundAt(g, s.x, this.centre.y + 3, s.z, 14) ?? this.centre.y;
      this.spots.push(s);
      const m = flechetteMesh();
      m.scale.setScalar(4.2);
      m.quaternion.setFromUnitVectors(Z, new THREE.Vector3(0, -1, 0));
      g.engine.gr.scene.add(m);
      this.rods.push(m);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pts, 3));
    this.lines = new THREE.LineSegments(geo, this.lineMat);
    this.lines.frustumCulled = false;
    g.engine.gr.scene.add(this.lines);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const tg = this.target;
    if (!this.holding && this.t >= this.fallT) {
      this.holding = true;
      for (const s of this.spots) {
        g.engine.destruction.carve(new SphereShape(s.clone(), 0.35), { mode: 'smash', power: 200, impulse: 2 });
        g.sparks(s.clone().setY(s.y + 0.2), UP, CRYSTAL, 6);
      }
      g.sfx.play('impact', this.centre, 0.9);
      g.addRing(this.centre.clone(), this.radius + 0.4, CRYSTAL, 0.35);
    }
    if (!this.holding) return;
    const out = Math.hypot(tg.pos.x - this.centre.x, tg.pos.z - this.centre.z) > this.radius + 0.6;
    if (tg.dead || out || this.t >= this.fallT + this.dur) {
      this.finish(g);
      return;
    }
    // the cage: sealed, rooted, its reiatsu drained into the rods
    tg.sealT = Math.max(tg.sealT, 0.3);
    tg.sealK = Math.max(tg.sealK, 0.3);
    tg.rooted = true;
    tg.rei = Math.max(0, tg.rei - this.drain * dt);
    if (Math.random() < 0.6) {
      const c = tg.center(), s = this.spots[Math.floor(Math.random() * 5)];
      const life = 0.35;
      g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: (s.x - c.x) / life, vy: (s.y + 1 - c.y) / life, vz: (s.z - c.z) / life, size: 0.12, sizeEnd: 0.05, life, r: CRY.r, g: CRY.g, b: CRY.b, alpha: 0.9, alphaEnd: 0.2, tex: TEX_STREAK, stretch: 2 });
    }
  }

  private finish(g: Game): void {
    if (this.holding) this.target.rooted = false;
    this.holding = false;
    for (const s of this.spots)
      for (let i = 0; i < 8; i++) {
        const a = Math.random() * Math.PI * 2;
        g.engine.glow.spawn({ x: s.x, y: s.y + Math.random() * 1.4, z: s.z, vx: Math.cos(a) * 2, vy: 1 + Math.random() * 2, vz: Math.sin(a) * 2, size: 0.1, sizeEnd: 0.02, life: 0.45, r: CRY.r, g: CRY.g, b: CRY.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
      }
    g.sfx.play('shatter', this.centre, 0.6);
    this.done = true;
  }

  render(): void {
    const k = Math.min(1, this.t / this.fallT);
    const rodH = 1.4;
    this.spots.forEach((s, i) => {
      const m = this.rods[i];
      // falling point-first from high above, then stuck in the ground
      m.position.set(s.x, s.y + 0.55 + (1 - k) * 9, s.z);
    });
    this.lineMat.opacity = this.holding ? 0.75 + 0.2 * Math.sin(this.t * 30) : 0;
    if (!this.holding) return;
    let j = 0;
    const put = (p: THREE.Vector3) => {
      this.pts[j++] = p.x;
      this.pts[j++] = p.y;
      this.pts[j++] = p.z;
    };
    for (let i = 0; i < 5; i++) {
      const a = this.spots[i], b = this.spots[(i + 1) % 5], c = this.spots[(i + 2) % 5];
      put(_a.set(a.x, a.y + rodH, a.z)); put(_b.set(b.x, b.y + rodH, b.z));
      put(_a.set(a.x, a.y + 0.08, a.z)); put(_b.set(b.x, b.y + 0.08, b.z));
      // the pentagram on the ground
      put(_a.set(a.x, a.y + 0.06, a.z)); put(_c.set(c.x, c.y + 0.06, c.z));
    }
    (this.lines.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  dispose(): void {
    if (this.holding) this.target.rooted = false;
    for (const m of this.rods) m.removeFromParent();
    this.lines.removeFromParent();
    this.lines.geometry.dispose();
    this.lineMat.dispose();
  }
}

// ------------------------------------------------------------------ the Icosahedron Barrier

/**
 * A two-layer shell round him (an icosahedron outside, a dodecahedron inside): enemy shots touching it are undone;
 * the kit cuts the damage of blows while it is up. unfold(): the outer panels open out behind him and fire a few
 * dozen beams converging on the target over a second.
 */
export class IcosahedronBarrier implements Projectile {
  done = false;
  up = true;
  private t = 0;
  /** seconds it has stood */
  get age(): number {
    return this.up ? this.t : 0;
  }
  private shell = new THREE.Group();
  private outer = new THREE.IcosahedronGeometry(1.8, 0);
  private inner = new THREE.DodecahedronGeometry(1.15, 0);
  private outerEdges: THREE.EdgesGeometry;
  private innerEdges: THREE.EdgesGeometry;
  private edgeMat = new THREE.LineBasicMaterial({ color: CRY.clone().multiplyScalar(2), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  private faceMat = additive(CRYSTAL, 1, 0.1);
  private flash = 0;
  private panels: { mesh: THREE.Mesh; from: THREE.Vector3; to: THREE.Vector3 }[] = [];
  private panelGeos: THREE.BufferGeometry[] = [];
  private target: Fighter | null = null;
  private fired = 0;
  private beamAcc = 0;
  private beams: { mesh: THREE.Mesh; life: number }[] = [];
  private beamGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 5, 1, true);
  private beamMat = additive(PFEIL_CORE, 2.6, 0.95);

  /**
   * `expire`: who to fire at when the shell's time runs out (the panels open on their own as it gives); null lets it
   * simply fade
   */
  constructor(private g: Game, private owner: Fighter, readonly dur = 6, readonly beamCount = 24, readonly beamDamage = 8, private expire: (() => Fighter | null) | null = null) {
    this.outerEdges = new THREE.EdgesGeometry(this.outer);
    this.innerEdges = new THREE.EdgesGeometry(this.inner);
    const parts = [new THREE.Mesh(this.outer, this.faceMat), new THREE.LineSegments(this.outerEdges, this.edgeMat), new THREE.LineSegments(this.innerEdges, this.edgeMat)];
    for (const p of parts) {
      p.frustumCulled = false;
      this.shell.add(p);
    }
    g.engine.gr.scene.add(this.shell);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    this.flash = Math.max(0, this.flash - dt * 4);
    if (this.up) {
      if (this.owner.dead) {
        this.up = false;
        this.done = true;
        return;
      }
      if (this.t >= this.dur) {
        const t = this.expire?.() ?? null;
        if (t) this.unfold(t);
        else {
          this.up = false;
          this.done = true;
        }
        return;
      }
      const c = this.owner.center();
      // big shots are stopped as they touch the shell (their centres never reach it)
      if (g.rejectNear(c, 3.2, this.owner, false) > 0) {
        this.flash = 1;
        g.sfx.play('ting', c, 0.7);
        g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 3.6, sizeEnd: 4.2, life: 0.15, r: CRY.r, g: CRY.g, b: CRY.b, alpha: 0.5, alphaEnd: 0, tex: TEX_GLOW });
      }
      return;
    }
    // the volley: the beams, one after another from the open panels
    if (this.fired < this.beamCount && this.t > 0.3) {
      this.beamAcc += dt * this.beamCount / 1.0;
      while (this.beamAcc >= 1 && this.fired < this.beamCount) {
        this.beamAcc -= 1;
        this.fire(g, this.panels[this.fired % this.panels.length].mesh.position, this.fired);
        this.fired++;
      }
    }
    for (const b of this.beams) b.life -= dt;
    for (const b of this.beams.filter((x) => x.life <= 0)) b.mesh.removeFromParent();
    this.beams = this.beams.filter((x) => x.life > 0);
    if (this.fired >= this.beamCount && this.beams.length === 0 && this.t > 1.5) this.done = true;
  }

  /** G again: the panels open and fire */
  unfold(target: Fighter | null): void {
    if (!this.up) return;
    this.up = false;
    this.t = 0;
    this.target = target;
    this.shell.visible = false;
    const c = this.owner.center();
    const fwd = target ? target.center().sub(c).normalize() : this.owner.forward(new THREE.Vector3());
    const side = new THREE.Vector3().crossVectors(UP, fwd).normalize();
    const up = new THREE.Vector3().crossVectors(fwd, side).normalize();
    const pos = (this.outer.attributes.position as THREE.BufferAttribute);
    const idx = this.outer.index;
    const tri = (i: number) => (idx ? idx.getX(i) : i);
    const n = (idx ? idx.count : pos.count) / 3;
    for (let f = 0; f < n; f++) {
      const vs = [0, 1, 2].map((k) => new THREE.Vector3().fromBufferAttribute(pos, tri(f * 3 + k)));
      const mid = vs[0].clone().add(vs[1]).add(vs[2]).multiplyScalar(1 / 3);
      const geo = new THREE.BufferGeometry().setFromPoints(vs.map((v) => v.clone().sub(mid).multiplyScalar(1.3)));
      this.panelGeos.push(geo);
      const m = new THREE.Mesh(geo, this.faceMat);
      m.frustumCulled = false;
      // fanned out in a great ring behind him, facing the target
      const a = (f / n) * Math.PI * 2;
      const to = c.clone().addScaledVector(fwd, -1.2).addScaledVector(side, Math.cos(a) * 3.4).addScaledVector(up, 0.8 + Math.sin(a) * 2.4);
      const from = c.clone().add(mid.applyQuaternion(this.shell.quaternion));
      m.position.copy(from);
      this.g.engine.gr.scene.add(m);
      this.panels.push({ mesh: m, from, to });
    }
    this.faceMat.opacity = 0.35;
    this.g.sfx.play('charge', c, 1);
  }

  private fire(g: Game, from: THREE.Vector3, i: number): void {
    const tg = this.target;
    const aim = tg && !tg.dead ? tg.center() : from.clone().addScaledVector(this.owner.forward(_v), 30);
    const d = aim.clone().sub(from);
    let len = d.length();
    d.normalize();
    const hit = raycastVoxels(g.engine.world, from.x, from.y, from.z, d.x, d.y, d.z, len);
    if (hit) {
      len = hit.dist;
      const p = from.clone().addScaledVector(d, len);
      g.engine.destruction.carve(new SphereShape(p, 0.35), { mode: 'bore', power: 260 });
    } else if (tg && !tg.dead) {
      g.damage(tg, this.beamDamage, this.owner, new THREE.Vector3(d.x, 0, d.z).normalize(), { energy: true, knock: 1.5, quiet: i % 6 !== 5, color: CRYSTAL });
    }
    const m = new THREE.Mesh(this.beamGeo, this.beamMat);
    m.frustumCulled = false;
    m.position.copy(from).addScaledVector(d, len / 2);
    m.quaternion.setFromUnitVectors(UP, d);
    m.scale.set(1, len, 1);
    g.engine.gr.scene.add(m);
    this.beams.push({ mesh: m, life: 0.09 });
    const e = from.clone().addScaledVector(d, len);
    g.engine.glow.spawn({ x: e.x, y: e.y, z: e.z, size: 0.5, sizeEnd: 0.1, life: 0.12, r: CORE.r, g: CORE.g, b: CORE.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    if (i % 4 === 0) g.sfx.play('arrow', from, 0.7);
  }

  render(): void {
    if (this.up) {
      this.shell.position.copy(this.owner.center(_v));
      this.shell.rotation.set(this.t * 0.4, this.t * 0.6, 0);
      const k = Math.min(1, this.t / 0.2);
      this.shell.scale.setScalar(0.3 + 0.7 * k);
      this.edgeMat.opacity = 0.55 + 0.4 * this.flash;
      this.faceMat.opacity = 0.08 + 0.2 * this.flash;
      return;
    }
    const k = Math.min(1, this.t / 0.3);
    const e = 1 - Math.pow(1 - k, 3);
    const tg = this.target;
    for (const p of this.panels) {
      p.mesh.position.lerpVectors(p.from, p.to, e);
      if (tg && !tg.dead) p.mesh.lookAt(tg.center(_w));
    }
  }

  dispose(): void {
    this.shell.removeFromParent();
    for (const p of this.panels) p.mesh.removeFromParent();
    for (const b of this.beams) b.mesh.removeFromParent();
    for (const geo of [this.outer, this.inner, this.outerEdges, this.innerEdges, this.beamGeo, ...this.panelGeos]) geo.dispose();
    for (const m of [this.edgeMat, this.faceMat, this.beamMat]) m.dispose();
  }
}

// ------------------------------------------------------------------ the pillar, the shadow, Sklaverei

/** The Vollständig's pillar of light: a column dropping round him, widening, then gone. */
export class LightPillar implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.Mesh;
  private mat: THREE.MeshBasicMaterial;

  /** `color`: the Vollständig's own (Uryū's is a pale blue-white, Bazz-B's red) */
  constructor(g: Game, private at: THREE.Vector3, readonly dur = 1.4, readonly height = 70, color: THREE.ColorRepresentation = '#CFF6FD') {
    this.mat = additive(color, 1.6, 0.6);
    const geo = new THREE.CylinderGeometry(1, 1, height, 20, 1, true);
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 6;
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number): void {
    this.t += dt;
    if (this.t >= this.dur) this.done = true;
  }

  render(): void {
    const k = this.t / this.dur;
    const r = k < 0.25 ? 0.3 + 2.4 * (k / 0.25) : 2.7 * (1 - (k - 0.25) / 0.75) + 0.2;
    this.mesh.position.set(this.at.x, this.at.y + this.height / 2 - 1, this.at.z);
    this.mesh.scale.set(r, 1, r);
    this.mat.opacity = 0.7 * (1 - k * k);
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}

/** The Schatten: a pool of shadow on the ground he sinks into (or rises from), dark wisps curling up. */
export class ShadowPool implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.Mesh;
  private mat = new THREE.MeshBasicMaterial({ color: '#0B0D16', transparent: true, opacity: 0.85, depthWrite: false });

  constructor(g: Game, readonly at: THREE.Vector3, readonly dur = 0.7) {
    const geo = new THREE.CircleGeometry(0.95, 28);
    geo.rotateX(-Math.PI / 2);
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.position.set(at.x, ground(g, at) + 0.04, at.z);
    this.mesh.renderOrder = 2;
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (Math.random() < 0.8) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * 0.8;
      g.engine.dust.spawn({ x: this.at.x + Math.cos(a) * r, y: this.mesh.position.y + 0.1, z: this.at.z + Math.sin(a) * r, vy: 1.2 + Math.random() * 1.5, size: 0.35, sizeEnd: 0.8, life: 0.5, r: 0.05, g: 0.06, b: 0.1, alpha: 0.75, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    }
    if (this.t >= this.dur) this.done = true;
  }

  render(): void {
    const k = this.t / this.dur;
    this.mesh.scale.setScalar(k < 0.3 ? 0.2 + 0.8 * (k / 0.3) : 1 - 0.7 * ((k - 0.3) / 0.7));
    this.mat.opacity = 0.85 * (1 - Math.max(0, k - 0.6) / 0.4);
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}

/**
 * Sklaverei: n rays out from him; whatever voxels they meet within `range` come apart into reishi (no rubble) that
 * streams into his body. Returns how many bites it took (the kit heals by them).
 */
export function sklaverei(g: Game, f: Fighter, n: number, range = 6, r = 0.55): number {
  const o = f.center();
  let bites = 0;
  for (let i = 0; i < n; i++) {
    const az = Math.random() * Math.PI * 2, el = -0.7 + Math.random() * 1.2;
    const d = _v.set(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el));
    const hit = raycastVoxels(g.engine.world, o.x, o.y, o.z, d.x, d.y, d.z, range);
    if (!hit || hit.dist < 0.6) continue;
    bites++;
    const p = o.clone().addScaledVector(d, hit.dist + 0.1);
    g.engine.destruction.carve(new SphereShape(p, r, 0.8), { mode: 'erase', power: 1200, dust: 0 });
    for (let k = 0; k < 6; k++) {
      const q = p.clone().add(_w.set((Math.random() - 0.5) * r * 2, (Math.random() - 0.5) * r * 2, (Math.random() - 0.5) * r * 2));
      const life = 0.35 + Math.random() * 0.25;
      g.engine.glow.spawn({ x: q.x, y: q.y, z: q.z, vx: (o.x - q.x) / life, vy: (o.y - q.y) / life, vz: (o.z - q.z) / life, size: 0.12, sizeEnd: 0.05, life, r: CRY.r, g: CRY.g, b: CRY.b, alpha: 0.95, alphaEnd: 0.2, tex: TEX_STREAK, stretch: 2 });
    }
  }
  // reishi drawn out of the air as well
  for (let k = 0; k < 4; k++) {
    const d = _v.set(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).normalize();
    const q = o.clone().addScaledVector(d, 3 + Math.random() * 3);
    const life = 0.4;
    g.engine.glow.spawn({ x: q.x, y: q.y, z: q.z, vx: (o.x - q.x) / life, vy: (o.y - q.y) / life, vz: (o.z - q.z) / life, size: 0.1, sizeEnd: 0.04, life, r: CORE.r, g: CORE.g, b: CORE.b, alpha: 0.8, alphaEnd: 0.2, tex: TEX_STREAK, stretch: 2 });
  }
  return bites;
}

/** Blut Vene: blue veins flashing under the skin where he is struck. */
export function veneFlash(g: Game, at: THREE.Vector3, n = 10): void {
  const c = new THREE.Color(VENE_BLUE);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.5) * 1.4;
    const sp = 1.5 + Math.random() * 2.5;
    g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, vx: Math.cos(a) * sp, vy: e * sp, vz: Math.sin(a) * sp, size: 0.05, sizeEnd: 0.015, life: 0.28, r: c.r, g: c.g, b: c.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 6 });
  }
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: 0.4, sizeEnd: 0.1, life: 0.18, r: 0.8, g: 0.9, b: 1, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
}
