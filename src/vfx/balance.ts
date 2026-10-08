// Haschwalth's effects (docs/kits/haschwalth.md). StarBlast: the energy thrown off his sword, a star of four points
// curving back. BalanceScales: the giant spectral scales that rise behind him and tip when misfortune is repaid.
// TheKey: the Hagal rune burnt into the ground under the raised sword, then the pillar of light and its beam into
// the sky. InversionMark: the sign over a target whose fortune is turned. BlackTorrent: the black of the night pouring
// after its target and swallowing shots on its way. blackMend(): the black closing over his wounds. shieldFlash(): the
// gold flare where the Freund Schild drinks a blow.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { CapsuleShape, SphereShape } from '../destruction/shapes';
import { raycastVoxels } from '../voxel/raycast';
import { LightPillar } from './heilig';
import { groundAt } from './iceArts';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

export const BLADE_LIGHT = '#CFE6FF';
export const SCALES_GOLD = '#E8C55A';
export const SHIELD_GOLD = '#E0B44A';
export const KEY_WHITE = '#E6F0FF';
export const NIGHT_RED = '#C0182A';

const UP = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const GOLD = new THREE.Color(SCALES_GOLD);

function additive(color: THREE.ColorRepresentation, k = 2, opacity = 0.9): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
}

function ground(g: Game, p: THREE.Vector3): number {
  return groundAt(g, p.x, p.y + 2, p.z, 12) ?? p.y;
}

// ------------------------------------------------------------------ the sword's blast

let starGeo: THREE.BufferGeometry | null = null;
/** a star of four points each curving back the same way, 1 m across, in the XY plane */
function starGeometry(): THREE.BufferGeometry {
  if (starGeo) return starGeo;
  const sh = new THREE.Shape();
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2;
    const tip = [Math.cos(a) * 0.5, Math.sin(a) * 0.5];
    const inner0 = [Math.cos(a - 0.62) * 0.12, Math.sin(a - 0.62) * 0.12];
    const inner1 = [Math.cos(a + 0.78) * 0.12, Math.sin(a + 0.78) * 0.12];
    const bend = [Math.cos(a + 0.5) * 0.36, Math.sin(a + 0.5) * 0.36];
    if (k === 0) sh.moveTo(inner0[0], inner0[1]);
    else sh.lineTo(inner0[0], inner0[1]);
    sh.lineTo(tip[0], tip[1]);
    sh.quadraticCurveTo(bend[0], bend[1], inner1[0], inner1[1]);
  }
  sh.closePath();
  starGeo = new THREE.ShapeGeometry(sh, 8);
  return starGeo;
}

/** The energy thrown off the blade: a spinning star of four curved points that cuts a groove through what it meets. */
export class StarBlast implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  readonly dir: THREE.Vector3;
  private mesh: THREE.Mesh;
  private core: THREE.Mesh;
  private mat = additive(BLADE_LIGHT, 2.2, 0.9);
  private coreMat = additive('#FFFFFF', 1.6, 0.9);
  private travelled = 0;
  private t = 0;
  private hit = new Set<number>();

  constructor(private owner: Fighter, g: Game, origin: THREE.Vector3, dir: THREE.Vector3, readonly damage = 18, readonly size = 1.3, readonly speed = 55) {
    this.pos = origin.clone();
    this.dir = dir.clone().normalize();
    this.mesh = new THREE.Mesh(starGeometry(), this.mat);
    this.core = new THREE.Mesh(starGeometry(), this.coreMat);
    this.core.scale.setScalar(0.45);
    this.mesh.add(this.core);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 7;
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const step = this.speed * dt;
    const a = this.pos.clone(), b = this.pos.clone().addScaledVector(this.dir, step);
    g.engine.destruction.carve(new CapsuleShape(a, b, 0.32 * this.size), { mode: 'bore', power: 350, dir: this.dir.clone(), sparks: [0.8, 0.9, 1], dust: 0.2 });
    for (const f of g.enemiesOf(this.owner)) {
      if (f.dead || this.hit.has(f.id)) continue;
      const to = _v.subVectors(f.center(), this.pos);
      const along = Math.max(0, Math.min(step, to.dot(this.dir)));
      const p = _w.copy(this.pos).addScaledVector(this.dir, along);
      const cy = Math.max(f.pos.y + 0.15, Math.min(f.pos.y + f.def.height - 0.15, p.y));
      if (Math.hypot(f.pos.x - p.x, cy - p.y, f.pos.z - p.z) > f.def.radius + 0.45 * this.size) continue;
      this.hit.add(f.id);
      g.damage(f, this.damage, this.owner, new THREE.Vector3(this.dir.x, 0, this.dir.z).normalize(), { energy: true, knock: 5, hitstop: 0.05, shake: 0.15, color: BLADE_LIGHT });
      g.sparks(f.center(), this.dir, BLADE_LIGHT, 8);
    }
    this.pos.copy(b);
    this.travelled += step;
    g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: -this.dir.x * 6, vy: -this.dir.y * 6, vz: -this.dir.z * 6, size: 0.5 * this.size, sizeEnd: 0.05, life: 0.16, r: 0.8, g: 0.9, b: 1, alpha: 0.6, alphaEnd: 0, tex: TEX_GLOW });
    if (this.travelled > 70) this.done = true;
  }

  render(): void {
    this.mesh.position.copy(this.pos);
    this.mesh.quaternion.setFromUnitVectors(Z, this.dir);
    this.mesh.rotateZ(this.t * 14);
    this.mesh.scale.setScalar(this.size);
  }

  reject(at: THREE.Vector3, radius: number, by: Fighter): boolean {
    if (by === this.owner || this.done || this.pos.distanceTo(at) > radius) return false;
    this.done = true;
    return true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mat.dispose();
    this.coreMat.dispose();
  }
}

// ------------------------------------------------------------------ the scales

/**
 * The scales of The Balance: a great spectral pair of scales rising behind him, the beam tipping toward whoever is
 * paid (`tip` from -1 to 1 at `tipAt`), then fading.
 */
export class BalanceScales implements Projectile {
  done = false;
  private t = 0;
  private group = new THREE.Group();
  private beam = new THREE.Group();
  private mat = additive(SCALES_GOLD, 1.8, 0.8);
  private lineMat = new THREE.LineBasicMaterial({ color: GOLD.clone().multiplyScalar(1.8), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
  private geos: THREE.BufferGeometry[] = [];
  private pans: THREE.Group[] = [];

  constructor(g: Game, private owner: Fighter, readonly tipAt = 0.42, readonly dur = 1.6, readonly tipSide = 1, readonly size = 4.2) {
    const s = size;
    const post = new THREE.CylinderGeometry(0.05 * s, 0.07 * s, s, 8);
    post.translate(0, s / 2, 0);
    const foot = new THREE.CylinderGeometry(0.28 * s, 0.34 * s, 0.06 * s, 16);
    const knob = new THREE.SphereGeometry(0.08 * s, 10, 8);
    knob.translate(0, s * 1.02, 0);
    const bar = new THREE.BoxGeometry(1.1 * s, 0.04 * s, 0.05 * s);
    this.geos.push(post, foot, knob, bar);
    this.group.add(new THREE.Mesh(post, this.mat), new THREE.Mesh(foot, this.mat), new THREE.Mesh(knob, this.mat));
    this.beam.position.y = s * 0.96;
    this.beam.add(new THREE.Mesh(bar, this.mat));
    for (const k of [1, -1]) {
      // each pan hangs on three cords from the end of the beam
      const pan = new THREE.Group();
      pan.position.x = k * 0.55 * s;
      const dish = new THREE.CylinderGeometry(0.22 * s, 0.12 * s, 0.05 * s, 16, 1, true);
      dish.translate(0, -0.55 * s, 0);
      this.geos.push(dish);
      pan.add(new THREE.Mesh(dish, this.mat));
      const pts: number[] = [];
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        pts.push(0, 0, 0, Math.cos(a) * 0.2 * s, -0.53 * s, Math.sin(a) * 0.2 * s);
      }
      const cords = new THREE.BufferGeometry();
      cords.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      this.geos.push(cords);
      pan.add(new THREE.LineSegments(cords, this.lineMat));
      this.beam.add(pan);
      this.pans.push(pan);
    }
    this.group.add(this.beam);
    this.group.traverse((o) => { o.frustumCulled = false; });
    g.engine.gr.scene.add(this.group);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (Math.random() < 0.6) {
      const p = this.group.position;
      g.engine.glow.spawn({ x: p.x + (Math.random() - 0.5) * this.size, y: p.y + Math.random() * this.size, z: p.z + (Math.random() - 0.5) * 0.6, vy: 0.6, size: 0.08, sizeEnd: 0.02, life: 0.6, r: GOLD.r, g: GOLD.g, b: GOLD.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
    if (this.t >= this.dur) this.done = true;
  }

  render(): void {
    const f = this.owner;
    const back = f.forward(_v).multiplyScalar(-1.3);
    this.group.position.set(f.pos.x + back.x, f.pos.y - 0.2, f.pos.z + back.z);
    this.group.rotation.y = f.yaw;
    const k = Math.min(1, this.t / 0.25);
    const out = this.t > this.dur - 0.35 ? Math.max(0, (this.dur - this.t) / 0.35) : 1;
    this.mat.opacity = 0.75 * k * out;
    this.lineMat.opacity = 0.8 * k * out;
    const tip = this.t < this.tipAt ? 0 : Math.min(1, (this.t - this.tipAt) / 0.25);
    const ang = 0.38 * tip * this.tipSide;
    this.beam.rotation.z = ang;
    for (const p of this.pans) p.rotation.z = -ang;
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const geo of this.geos) geo.dispose();
    this.mat.dispose();
    this.lineMat.dispose();
  }
}

// ------------------------------------------------------------------ the Key

/**
 * The Key: the Hagal rune (a stroke crossed by an X) burns white into the ground round him; at `pillarAt` the pillar
 * of light goes up with a beam into the sky, and whoever stands near is blasted apart.
 */
export class TheKey implements Projectile {
  done = false;
  private t = 0;
  private rune: THREE.Mesh[] = [];
  private mat = additive(KEY_WHITE, 2.4, 0);
  private beam: THREE.Mesh;
  private beamMat = additive(KEY_WHITE, 2.2, 0);
  private fired = false;
  private at: THREE.Vector3;

  constructor(private g: Game, private owner: Fighter, readonly pillarAt = 0.32, readonly damage = 60, readonly radius = 4) {
    this.at = owner.pos.clone();
    this.at.y = ground(g, this.at) + 0.05;
    const r = 3.2;
    // the Hagal rune: one stroke along his facing, and an X across it
    const strokes: [number, number][] = [[0, 2 * r], [Math.PI / 4, 1.7 * r], [-Math.PI / 4, 1.7 * r]];
    for (const [a, len] of strokes) {
      const geo = new THREE.PlaneGeometry(0.22, len);
      geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, this.mat);
      m.position.copy(this.at);
      m.rotation.y = owner.yaw + a;
      m.frustumCulled = false;
      g.engine.gr.scene.add(m);
      this.rune.push(m);
    }
    const ring = new THREE.RingGeometry(r * 0.98, r * 1.04, 48);
    ring.rotateX(-Math.PI / 2);
    const rm = new THREE.Mesh(ring, this.mat);
    rm.position.copy(this.at);
    rm.frustumCulled = false;
    g.engine.gr.scene.add(rm);
    this.rune.push(rm);
    const bgeo = new THREE.CylinderGeometry(0.6, 0.6, 120, 12, 1, true);
    this.beam = new THREE.Mesh(bgeo, this.beamMat);
    this.beam.position.set(this.at.x, this.at.y + 60, this.at.z);
    this.beam.frustumCulled = false;
    g.engine.gr.scene.add(this.beam);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (!this.fired && this.t >= this.pillarAt) {
      this.fired = true;
      const c = this.at.clone().setY(this.at.y + 1);
      g.addProjectile(new LightPillar(g, this.at.clone(), 1.2, 60));
      g.engine.destruction.carve(new SphereShape(c, this.radius, 0.9), { mode: 'explode', power: 900, impulse: 12 });
      for (const e of g.enemiesOf(this.owner)) {
        const d = Math.hypot(e.pos.x - this.at.x, e.pos.z - this.at.z);
        if (d > this.radius + 1.5 || Math.abs(e.pos.y - this.at.y) > 6) continue;
        const away = e.pos.clone().sub(this.at).setY(0);
        if (away.lengthSq() < 1e-4) away.set(0, 0, 1);
        g.damage(e, this.damage, this.owner, away.normalize(), { energy: true, heavy: true, knock: 20, launch: 8, hitstop: 0.12, shake: 0.5, color: KEY_WHITE });
      }
      g.addRing(this.at.clone(), this.radius * 2.4, KEY_WHITE, 0.5);
      g.sfx.play('beam', c, 1.2);
      g.shake(this.owner === g.player ? 0.45 : 0.2);
    }
    if (this.t >= this.pillarAt + 1.3) this.done = true;
  }

  render(): void {
    const t = this.t;
    const runeK = Math.min(1, t / 0.25) * (t > this.pillarAt + 0.8 ? Math.max(0, 1 - (t - this.pillarAt - 0.8) / 0.5) : 1);
    this.mat.opacity = 0.9 * runeK;
    const bk = t < this.pillarAt ? 0 : Math.max(0, 1 - (t - this.pillarAt) / 1.3);
    this.beamMat.opacity = 0.85 * bk;
    this.beam.scale.set(0.4 + bk, 1, 0.4 + bk);
  }

  dispose(): void {
    for (const m of this.rune) {
      m.removeFromParent();
      m.geometry.dispose();
    }
    this.beam.removeFromParent();
    this.beam.geometry.dispose();
    this.mat.dispose();
    this.beamMat.dispose();
  }
}

// ------------------------------------------------------------------ Fortune Inversion

/** The sign over a target whose fortune is turned: an inverted gold triangle in a ring above its head, while it lasts. */
export class InversionMark implements Projectile {
  done = false;
  private t = 0;
  private group = new THREE.Group();
  private mat = additive(SCALES_GOLD, 2, 0.9);
  private geos: THREE.BufferGeometry[] = [];

  constructor(g: Game, readonly target: Fighter, readonly dur = 6) {
    const tri = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.22, 0.14, 0), new THREE.Vector3(0.22, 0.14, 0), new THREE.Vector3(0, -0.24, 0)]);
    tri.setIndex([0, 1, 2]);
    const ring = new THREE.RingGeometry(0.3, 0.34, 32);
    this.geos.push(tri, ring);
    this.group.add(new THREE.Mesh(tri, this.mat), new THREE.Mesh(ring, this.mat));
    this.group.traverse((o) => { o.frustumCulled = false; });
    g.engine.gr.scene.add(this.group);
  }

  update(dt: number): void {
    this.t += dt;
    if (this.t >= this.dur || this.target.dead) this.done = true;
  }

  render(): void {
    const p = this.target.pos;
    this.group.position.set(p.x, p.y + this.target.def.height + 0.45, p.z);
    this.group.rotation.y = this.t * 2.4;
    this.mat.opacity = 0.9 * Math.min(1, this.t / 0.2) * Math.min(1, (this.dur - this.t) / 0.4);
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const geo of this.geos) geo.dispose();
    this.mat.dispose();
  }
}

// ------------------------------------------------------------------ the night's black

/**
 * The black torrent: a mass of the night's black that pours after its target for a few seconds, battering what it
 * reaches and swallowing enemy shots on its way.
 */
export class BlackTorrent implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  private t = 0;
  private tick = 0;
  private vel = new THREE.Vector3();

  constructor(private g: Game, private owner: Fighter, from: THREE.Vector3, private target: Fighter | null, readonly damage = 12, readonly life = 3, readonly size = 1.6) {
    this.pos = from.clone();
    owner.forward(this.vel).multiplyScalar(10);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const tg = this.target;
    if (tg && !tg.dead) {
      const want = tg.center().sub(this.pos).normalize().multiplyScalar(15);
      this.vel.lerp(want, Math.min(1, dt * 3));
    }
    this.pos.addScaledVector(this.vel, dt);
    const gy = ground(g, this.pos);
    if (this.pos.y < gy + 0.6) this.pos.y = gy + 0.6;
    g.rejectNear(this.pos, this.size + 0.4, this.owner, false);
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * this.size;
      g.engine.dust.spawn({ x: this.pos.x + Math.cos(a) * r, y: this.pos.y + (Math.random() - 0.5) * this.size, z: this.pos.z + Math.sin(a) * r, vx: this.vel.x * 0.3 + (Math.random() - 0.5) * 2, vy: (Math.random() - 0.3) * 2, vz: this.vel.z * 0.3 + (Math.random() - 0.5) * 2, size: 0.7 * this.size, sizeEnd: 1.3 * this.size, life: 0.45, r: 0.03, g: 0.025, b: 0.04, alpha: 0.9, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    }
    if (Math.random() < 0.3) g.engine.destruction.carve(new SphereShape(this.pos.clone(), this.size * 0.6, 0.6), { mode: 'smash', power: 280, impulse: 5, dust: 0.3 });
    this.tick -= dt;
    if (this.tick <= 0) {
      this.tick = 0.25;
      for (const e of g.enemiesOf(this.owner)) {
        if (e.dead || e.center().distanceTo(this.pos) > this.size + e.def.radius + 0.3) continue;
        g.damage(e, this.damage, this.owner, this.vel.clone().setY(0).normalize(), { knock: 6, launch: 1.5, hitstop: 0.03, color: '#2A1A2E' });
      }
    }
    if (this.t >= this.life) this.done = true;
  }

  dispose(): void {}
}

/** The black closing over his wounds: dark patches crawling over the body. */
export function blackMend(g: Game, f: Fighter): void {
  const c = f.center();
  for (let i = 0; i < 3; i++) {
    const a = Math.random() * Math.PI * 2;
    g.engine.dust.spawn({ x: c.x + Math.cos(a) * 0.3, y: c.y + (Math.random() - 0.5) * 1.2, z: c.z + Math.sin(a) * 0.3, vx: -Math.cos(a) * 0.3, vy: 0.2, vz: -Math.sin(a) * 0.3, size: 0.3, sizeEnd: 0.12, life: 0.5, r: 0.03, g: 0.025, b: 0.04, alpha: 0.85, alphaEnd: 0, tex: TEX_PUFF });
  }
}

/** The gold flare where the Freund Schild drinks a blow (or a shot sinks harmless into the ground before him). */
export function shieldFlash(g: Game, at: THREE.Vector3, big = false): void {
  const c = new THREE.Color(SHIELD_GOLD);
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: big ? 1.4 : 0.8, sizeEnd: big ? 2.2 : 1.2, life: 0.18, r: c.r, g: c.g, b: c.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
  for (let i = 0; i < (big ? 14 : 7); i++) {
    const a = Math.random() * Math.PI * 2;
    g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, vx: Math.cos(a) * 3, vy: Math.random() * 3, vz: Math.sin(a) * 3, size: 0.06, sizeEnd: 0.02, life: 0.35, r: c.r, g: c.g, b: c.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2, drag: 3 });
  }
}

/** a ground point under p (for the kit) */
export function groundUnder(g: Game, p: THREE.Vector3): THREE.Vector3 {
  const hit = raycastVoxels(g.engine.world, p.x, p.y + 1, p.z, 0, -1, 0, 20);
  return hit ? new THREE.Vector3(p.x, p.y + 1 - hit.dist, p.z) : p.clone();
}

export { UP };
