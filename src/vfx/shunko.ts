// Yoruichi's lightning. ShunkoField: the compressed lightning Kidō of Shunkō crawling over the back,
// shoulders and arms (and the legs in Raijin Senkei), as flickering jagged bolts with glow sparks.
// DrumRing: Raijin Senkei's ring of thunder drums on her back, linked by arcs. ThunderColumn: the giant
// column of lightning brought down on the target; it scorches and gouges the ground. BlindOrb: a light orb
// thrown from the drums that bursts in a blinding flash. Kunai: Anken, the boot knives. shunkoBurst: the
// Kidō fired out of the body in a cone that tears up and scorches the ground.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { CapsuleShape, SphereShape } from '../destruction/shapes';
import { raycastVoxels } from '../voxel/raycast';
import { groundAt } from './iceArts';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

export interface BoltStyle {
  core: THREE.ColorRepresentation;
  edge: THREE.ColorRepresentation;
}
/** Shunkō (the Soul Society look): white lightning with a violet fringe. */
export const BOLT_SHUNKO: BoltStyle = { core: '#F6F2FF', edge: '#B8A8FF' };
/** Raijin Senkei: molten gold. */
export const BOLT_RAIJIN: BoltStyle = { core: '#FFF6C8', edge: '#F2B21C' };

/** A dynamic batch of jagged line bolts, rebuilt whenever asked. */
export class Bolts {
  readonly lines: THREE.LineSegments;
  private pos: Float32Array;
  private n = 0;
  readonly mat: THREE.LineBasicMaterial;

  constructor(scene: THREE.Object3D, readonly max = 256, color: THREE.ColorRepresentation = '#ffffff') {
    this.pos = new Float32Array(max * 6);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.mat = new THREE.LineBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2.2), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    this.lines = new THREE.LineSegments(geo, this.mat);
    this.lines.frustumCulled = false;
    this.lines.renderOrder = 8;
    scene.add(this.lines);
  }

  begin(): void {
    this.n = 0;
  }

  /** A bolt from a to b in `segs` jagged segments, each kink up to `jag` (m) off the line. Returns the kinks. */
  bolt(a: THREE.Vector3, b: THREE.Vector3, jag: number, segs = 6, out?: THREE.Vector3[]): void {
    let px = a.x, py = a.y, pz = a.z;
    for (let i = 1; i <= segs; i++) {
      const t = i / segs;
      const j = i === segs ? 0 : jag * Math.sin(t * Math.PI);
      const x = a.x + (b.x - a.x) * t + (Math.random() - 0.5) * 2 * j;
      const y = a.y + (b.y - a.y) * t + (Math.random() - 0.5) * 2 * j;
      const z = a.z + (b.z - a.z) * t + (Math.random() - 0.5) * 2 * j;
      if (this.n >= this.max) return;
      const o = this.n * 6;
      this.pos[o] = px; this.pos[o + 1] = py; this.pos[o + 2] = pz;
      this.pos[o + 3] = x; this.pos[o + 4] = y; this.pos[o + 5] = z;
      this.n++;
      if (out && i < segs) out.push(new THREE.Vector3(x, y, z));
      px = x; py = y; pz = z;
    }
  }

  end(): void {
    const geo = this.lines.geometry;
    geo.setDrawRange(0, this.n * 2);
    (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  dispose(): void {
    this.lines.removeFromParent();
    this.lines.geometry.dispose();
    this.mat.dispose();
  }
}

function sockAt(f: Fighter, name: string, out: THREE.Vector3): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

function boneAt(f: Fighter, name: string, out: THREE.Vector3): THREE.Vector3 {
  const b = f.visual.rig.bone(name);
  b.updateWorldMatrix(true, false);
  return b.getWorldPosition(out);
}

// ------------------------------------------------------------------ Shunkō

/** The lightning over the back, shoulders and arms. Ease `level` 0..1; `legs` adds the legs (Raijin). */
export class ShunkoField implements Projectile {
  done = false;
  level = 0;
  legs = false;
  private bolts: Bolts;
  private edge: Bolts;
  private t = 0;
  private flick = 0;
  private col: THREE.Color;
  private colE: THREE.Color;

  constructor(private g: Game, private owner: Fighter, public style: BoltStyle = BOLT_SHUNKO) {
    this.bolts = new Bolts(g.engine.gr.scene, 160, style.core);
    this.edge = new Bolts(g.engine.gr.scene, 160, style.edge);
    this.col = new THREE.Color(style.core);
    this.colE = new THREE.Color(style.edge);
  }

  setStyle(s: BoltStyle): void {
    this.style = s;
    this.bolts.mat.color.set(s.core).multiplyScalar(2.2);
    this.edge.mat.color.set(s.edge).multiplyScalar(2.2);
    this.col.set(s.core);
    this.colE.set(s.edge);
  }

  update(dt: number): void {
    this.t += dt;
  }

  render(dt: number): void {
    const f = this.owner;
    const k = f.dead ? 0 : this.level;
    this.bolts.lines.visible = this.edge.lines.visible = k > 0.03;
    if (k <= 0.03) return;
    this.flick -= dt;
    if (this.flick > 0) return;
    this.flick = 0.045;
    const g = this.g;
    const P = (n: string) => sockAt(f, n, new THREE.Vector3());
    const B = (n: string) => boneAt(f, n, new THREE.Vector3());
    const back = P('back'), shL = P('shoulder.L'), shR = P('shoulder.R');
    const elL = B('forearm.L'), elR = B('forearm.R'), hL = P('knuckle.L'), hR = P('knuckle.R');
    const anchors = [back, shL, shR, elL, elR, hL, hR];
    const links: [THREE.Vector3, THREE.Vector3][] = [[back, shL], [back, shR], [shL, elL], [shR, elR], [elL, hL], [elR, hR]];
    if (this.legs) {
      const kL = B('shin.L'), kR = B('shin.R'), tL = P('toe.L'), tR = P('toe.R'), hp = B('hips');
      anchors.push(kL, kR, tL, tR);
      links.push([hp, kL], [hp, kR], [kL, tL], [kR, tR]);
    }
    const kinks: THREE.Vector3[] = [];
    this.bolts.begin();
    this.edge.begin();
    for (const [a, b] of links) {
      if (Math.random() > 0.35 + k * 0.6) continue;
      this.bolts.bolt(a, b, 0.07 + 0.05 * k, 5, kinks);
      if (Math.random() < 0.6) this.edge.bolt(a, b, 0.12 + 0.06 * k, 5);
    }
    // short arcs leaping off the back and the arms
    const leaps = Math.round(3 + k * 6);
    for (let i = 0; i < leaps; i++) {
      const a = anchors[Math.floor(Math.random() * anchors.length)];
      const d = _v.set(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).normalize().multiplyScalar(0.2 + Math.random() * 0.45 * k);
      const b = a.clone().add(d);
      (Math.random() < 0.5 ? this.bolts : this.edge).bolt(a, b, 0.06, 3, kinks);
    }
    this.bolts.end();
    this.edge.end();
    this.bolts.mat.opacity = 0.95 * k;
    this.edge.mat.opacity = 0.7 * k;
    // glow at the kinks and over the back
    for (let i = 0; i < Math.min(6, kinks.length); i++) {
      const p = kinks[Math.floor(Math.random() * kinks.length)];
      const c = Math.random() < 0.5 ? this.col : this.colE;
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.12 + 0.1 * k, sizeEnd: 0.02, life: 0.09, r: c.r, g: c.g, b: c.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
    g.engine.glow.spawn({ x: back.x, y: back.y, z: back.z, size: 0.5 + 0.4 * k, sizeEnd: 0.2, life: 0.08, r: this.colE.r, g: this.colE.g, b: this.colE.b, alpha: 0.45 * k, alphaEnd: 0, tex: TEX_GLOW });
  }

  dispose(): void {
    this.bolts.dispose();
    this.edge.dispose();
  }
}

// ------------------------------------------------------------------ Raijin Senkei

/** Raijin's ring of thunder drums standing on her back, turning slowly, linked by arcs. */
export class DrumRing implements Projectile {
  done = false;
  level = 0;
  private group = new THREE.Group();
  private drums: THREE.Mesh[] = [];
  private bolts: Bolts;
  private mat: THREE.MeshBasicMaterial;
  private rimMat: THREE.MeshBasicMaterial;
  private spin = 0;
  private flick = 0;
  readonly radius = 0.95;

  constructor(private g: Game, private owner: Fighter) {
    this.mat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#F2B21C').multiplyScalar(1.6), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    this.rimMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFF6C8').multiplyScalar(2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const body = new THREE.CylinderGeometry(0.15, 0.15, 0.12, 14, 1, false);
    body.rotateX(Math.PI / 2);
    const rim = new THREE.TorusGeometry(0.155, 0.02, 6, 16);
    for (let i = 0; i < 8; i++) {
      const d = new THREE.Mesh(body, this.mat);
      const r1 = new THREE.Mesh(rim, this.rimMat);
      const r2 = new THREE.Mesh(rim, this.rimMat);
      r1.position.z = 0.06;
      r2.position.z = -0.06;
      d.add(r1, r2);
      this.drums.push(d);
      this.group.add(d);
    }
    this.group.renderOrder = 8;
    this.bolts = new Bolts(g.engine.gr.scene, 120, '#FFF6C8');
    g.engine.gr.scene.add(this.group);
  }

  update(dt: number): void {
    this.spin += dt * 0.6;
  }

  render(dt: number): void {
    const f = this.owner;
    const k = f.dead ? 0 : this.level;
    this.group.visible = this.bolts.lines.visible = k > 0.02;
    if (k <= 0.02) return;
    const back = sockAt(f, 'back', new THREE.Vector3());
    const fw = f.forward(_w);
    const c = back.addScaledVector(fw, -0.38);
    c.y += 0.25;
    this.group.position.copy(c);
    this.group.rotation.set(0, f.yaw, 0);
    const R = this.radius * (0.6 + 0.4 * k);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 8; i++) {
      const a = this.spin + (i / 8) * Math.PI * 2;
      const d = this.drums[i];
      d.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
      d.rotation.set(0, 0, a);
      d.scale.setScalar(0.6 + 0.4 * k);
      d.updateMatrixWorld();
      pts.push(d.getWorldPosition(new THREE.Vector3()));
    }
    this.mat.opacity = 0.75 * k;
    this.rimMat.opacity = 0.95 * k;
    this.flick -= dt;
    if (this.flick <= 0) {
      this.flick = 0.05;
      this.bolts.begin();
      for (let i = 0; i < 8; i++) if (Math.random() < 0.7) this.bolts.bolt(pts[i], pts[(i + 1) % 8], 0.08, 4);
      if (Math.random() < 0.5) this.bolts.bolt(pts[Math.floor(Math.random() * 8)], c, 0.1, 5);
      this.bolts.end();
      this.bolts.mat.opacity = k;
      const p = pts[Math.floor(Math.random() * 8)];
      this.g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.4, sizeEnd: 0.1, life: 0.1, r: 1, g: 0.85, b: 0.4, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
    }
  }

  dispose(): void {
    this.group.removeFromParent();
    this.drums[0]?.geometry.dispose();
    this.mat.dispose();
    this.rimMat.dispose();
    this.bolts.dispose();
  }
}

/** The column: a giant pillar of lightning brought straight down on a spot; everything in it burns. */
export class ThunderColumn implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.Mesh;
  private core: THREE.Mesh;
  private mat: THREE.MeshBasicMaterial;
  private coreMat: THREE.MeshBasicMaterial;
  private bolts: Bolts;
  private tick = 0;
  private hit = new Map<number, number>();
  private bored = false;
  readonly base: THREE.Vector3;

  constructor(private g: Game, private owner: Fighter, at: THREE.Vector3, readonly radius = 2.4, readonly dur = 0.7, readonly damage = 160) {
    const gy = groundAt(g, at.x, at.y + 2, at.z, 12);
    this.base = new THREE.Vector3(at.x, gy ?? at.y, at.z);
    const H = 60;
    const geo = new THREE.CylinderGeometry(1, 1, H, 24, 1, true);
    geo.translate(0, H / 2, 0);
    this.mat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#F2B21C').multiplyScalar(1.5), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.coreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFF6C8').multiplyScalar(2.4), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.core = new THREE.Mesh(geo, this.coreMat);
    for (const m of [this.mesh, this.core]) {
      m.position.copy(this.base);
      m.frustumCulled = false;
      m.renderOrder = 8;
      g.engine.gr.scene.add(m);
    }
    this.bolts = new Bolts(g.engine.gr.scene, 200, '#FFF6C8');
    g.sfx.play('beam', this.base, 1.6);
    g.sfx.play('explode', this.base, 1.4);
    g.shake(0.6);
    g.engine.gr.chroma.offset.set(0.006, 0.006);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const live = this.t < this.dur;
    if (!this.bored) {
      this.bored = true;
      const b = this.base;
      // it bores a shaft into the ground and scorches a wide ring round itself
      g.engine.destruction.carve(new CapsuleShape(new THREE.Vector3(b.x, b.y - this.radius * 1.1, b.z), new THREE.Vector3(b.x, b.y + 4, b.z), this.radius * 0.8), { mode: 'explode', power: 900, impulse: 14, dust: 0.6 });
      g.engine.destruction.carve(new SphereShape(new THREE.Vector3(b.x, b.y, b.z), this.radius * 1.9, 0.22), { mode: 'burn', power: 400, dust: 0.3 });
    }
    if (live) {
      this.tick -= dt;
      if (this.tick <= 0) {
        this.tick = 0.06;
        const b = this.base;
        for (const o of g.enemiesOf(this.owner)) {
          if (Math.hypot(o.pos.x - b.x, o.pos.z - b.z) > this.radius + o.def.radius) continue;
          const n = this.hit.get(o.id) ?? 0;
          this.hit.set(o.id, n + 1);
          const per = this.damage / (this.dur / 0.06);
          g.damage(o, per, this.owner, new THREE.Vector3(0, 1, 0), { energy: true, knock: 0, launch: n === 0 ? 4 : 0, heavy: n === 0, hitstop: n === 0 ? 0.12 : 0, shake: 0, quiet: n % 3 !== 0, color: '#F2B21C' });
          o.hitstun = Math.max(o.hitstun, 0.3);
        }
      }
    }
    if (this.t > this.dur + 0.35) this.done = true;
  }

  render(): void {
    const t = this.t;
    const k = t < 0.08 ? t / 0.08 : t < this.dur ? 1 : Math.max(0, 1 - (t - this.dur) / 0.35);
    const flick = 0.85 + Math.random() * 0.3;
    this.mesh.scale.set(this.radius * flick, 1, this.radius * flick);
    this.core.scale.set(this.radius * 0.45 * flick, 1, this.radius * 0.45 * flick);
    this.mat.opacity = 0.55 * k;
    this.coreMat.opacity = 0.9 * k;
    const b = this.base;
    this.bolts.begin();
    if (k > 0.05)
      for (let i = 0; i < 8; i++) {
        const a = Math.random() * Math.PI * 2, r = this.radius * (0.9 + Math.random() * 0.8);
        const y0 = Math.random() * 30;
        this.bolts.bolt(new THREE.Vector3(b.x + Math.cos(a) * r * 0.6, b.y + y0 + 8, b.z + Math.sin(a) * r * 0.6), new THREE.Vector3(b.x + Math.cos(a) * r, b.y + y0, b.z + Math.sin(a) * r), 0.5, 6);
      }
    this.bolts.end();
    this.bolts.mat.opacity = k;
    if (k > 0.05) {
      this.g.engine.glow.spawn({ x: b.x, y: b.y + 0.4, z: b.z, size: this.radius * 3, sizeEnd: this.radius * 4.5, life: 0.08, r: 1, g: 0.86, b: 0.45, alpha: 0.7 * k, alphaEnd: 0, tex: TEX_GLOW });
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        this.g.engine.glow.spawn({ x: b.x, y: b.y + 0.3, z: b.z, vx: Math.cos(a) * 12, vy: 2 + Math.random() * 6, vz: Math.sin(a) * 12, size: 0.12, sizeEnd: 0.02, life: 0.4, r: 1, g: 0.9, b: 0.5, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, gravity: -8 });
      }
    }
  }

  dispose(): void {
    for (const m of [this.mesh, this.core]) m.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
    this.coreMat.dispose();
    this.bolts.dispose();
  }
}

/** A light orb thrown from the drums; it homes in and bursts in a blinding flash that stuns. */
export class BlindOrb implements Projectile {
  done = false;
  private pos: THREE.Vector3;
  private vel: THREE.Vector3;
  private t = 0;

  constructor(private owner: Fighter, from: THREE.Vector3, readonly target: Fighter | null, dir: THREE.Vector3, readonly damage = 18) {
    this.pos = from.clone();
    this.vel = dir.clone().normalize().multiplyScalar(26);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const tg = this.target;
    if (tg && !tg.dead) {
      const want = _v.subVectors(tg.center(), this.pos).normalize().multiplyScalar(30);
      this.vel.lerp(want, Math.min(1, dt * 5));
    }
    const step = this.vel.length() * dt;
    const d = this.vel.clone().normalize();
    const hitW = raycastVoxels(g.engine.world, this.pos.x, this.pos.y, this.pos.z, d.x, d.y, d.z, step);
    this.pos.addScaledVector(this.vel, dt);
    let burst = !!hitW || this.t > 2.5;
    for (const o of g.enemiesOf(this.owner)) if (o.center().distanceTo(this.pos) < o.def.radius + 0.5) burst = true;
    g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, size: 0.55, sizeEnd: 0.2, life: 0.08, r: 1, g: 0.97, b: 0.85, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    if (!burst) return;
    this.done = true;
    const p = this.pos;
    for (const o of g.enemiesOf(this.owner)) {
      if (o.center().distanceTo(p) > 3.2) continue;
      g.damage(o, this.damage, this.owner, o.pos.clone().sub(p).setY(0).normalize(), { energy: true, knock: 3, hitstop: 0.05, color: '#FFF6C8' });
      // blinded: it cannot act for a moment
      o.hitstun = Math.max(o.hitstun, 1.0);
    }
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 2, sizeEnd: 9, life: 0.3, r: 1, g: 0.98, b: 0.9, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    g.engine.destruction.carve(new SphereShape(p.clone(), 1.0, 0.8), { mode: 'explode', power: 140, impulse: 8 });
    g.sfx.play('crack', p, 1);
    if (g.player && g.player.pos.distanceTo(p) < 6 && g.player !== this.owner) g.engine.gr.chroma.offset.set(0.008, 0.008);
  }

  dispose(): void {}
}

// ------------------------------------------------------------------ Anken

let knifeGeo: THREE.BufferGeometry | null = null;

/** One boot knife: a short silver blade flung point first. */
export class Kunai implements Projectile {
  done = false;
  private mesh: THREE.Mesh;
  private pos: THREE.Vector3;
  private dir: THREE.Vector3;
  private travelled = 0;

  constructor(private owner: Fighter, g: Game, from: THREE.Vector3, dir: THREE.Vector3, readonly damage = 9) {
    this.pos = from.clone();
    this.dir = dir.clone().normalize();
    if (!knifeGeo) {
      const blade = new THREE.ConeGeometry(0.025, 0.2, 4);
      blade.rotateX(Math.PI / 2);
      blade.translate(0, 0, 0.1);
      knifeGeo = blade;
    }
    this.mesh = new THREE.Mesh(knifeGeo, new THREE.MeshStandardMaterial({ color: '#C8CCD4', metalness: 0.9, roughness: 0.25 }));
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number, g: Game): void {
    const step = 62 * dt;
    const hit = raycastVoxels(g.engine.world, this.pos.x, this.pos.y, this.pos.z, this.dir.x, this.dir.y, this.dir.z, step);
    for (const o of g.enemiesOf(this.owner)) {
      const to = _v.subVectors(o.center(), this.pos);
      const along = Math.max(0, Math.min(step, to.dot(this.dir)));
      const p = this.pos.clone().addScaledVector(this.dir, along);
      if (p.distanceTo(o.center()) > o.def.radius + 0.35) continue;
      g.damage(o, this.damage, this.owner, new THREE.Vector3(this.dir.x, 0, this.dir.z).normalize(), { energy: true, knock: 2, hitstop: 0.02 });
      g.sparks(p, this.dir, '#C8CCD4', 5);
      this.done = true;
      return;
    }
    if (hit) {
      this.pos.addScaledVector(this.dir, hit.dist);
      g.sparks(this.pos, this.dir.clone().negate(), '#E4E7EC', 6);
      g.sfx.play('ting', this.pos, 0.4);
      this.done = true;
      return;
    }
    this.pos.addScaledVector(this.dir, step);
    this.travelled += step;
    if (this.travelled > 60) this.done = true;
  }

  render(): void {
    this.mesh.position.copy(this.pos);
    this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.dir);
  }

  dispose(): void {
    this.mesh.removeFromParent();
    (this.mesh.material as THREE.Material).dispose();
  }
}

// ------------------------------------------------------------------ the burst

/**
 * The Shunkō burst: the Kidō fired out of the body in a cone that rips up and scorches the ground for
 * `len` metres. Returns whom it hit.
 */
export function shunkoBurst(g: Game, owner: Fighter, origin: THREE.Vector3, dir: THREE.Vector3, len: number, damage: number, style: BoltStyle = BOLT_SHUNKO): Fighter[] {
  const d = dir.clone().setY(0).normalize();
  const hit: Fighter[] = [];
  for (const o of g.enemiesOf(owner)) {
    const to = _v.subVectors(o.pos, origin).setY(0);
    const along = to.dot(d);
    if (along < -0.5 || along > len) continue;
    const off = to.addScaledVector(d, -along).length();
    if (off > 1 + along * 0.35 + o.def.radius) continue;
    g.damage(o, damage, owner, d.clone(), { energy: true, knock: 18, launch: 4, heavy: true, hitstop: 0.1, shake: 0.4, color: new THREE.Color(style.edge).getStyle() });
    o.hitstun = Math.max(o.hitstun, 0.45);
    hit.push(o);
  }
  const gy = groundAt(g, origin.x, origin.y, origin.z, 4) ?? owner.pos.y;
  for (let s = 1; s <= len; s += 1.4) {
    const p = new THREE.Vector3(origin.x + d.x * s, gy, origin.z + d.z * s);
    const r = 0.6 + s * 0.12;
    g.engine.destruction.carve(new SphereShape(p.clone().setY(gy + 0.2), r, 0.6), { mode: 'explode', power: 170, impulse: 10, dir: d, dust: 0.5 });
    g.engine.destruction.carve(new SphereShape(new THREE.Vector3(p.x, gy, p.z), r * 1.5, 0.25), { mode: 'burn', power: 300, dust: 0.2 });
  }
  const core = new THREE.Color(style.core), edge = new THREE.Color(style.edge);
  for (let i = 0; i < 46; i++) {
    const s = Math.random() * len, spread = (Math.random() - 0.5) * (1 + s * 0.6);
    const c = Math.random() < 0.5 ? core : edge;
    g.engine.glow.spawn({ x: origin.x + d.x * s - d.z * spread, y: gy + 0.3 + Math.random() * 1.6, z: origin.z + d.z * s + d.x * spread, vx: d.x * 14, vy: 2 + Math.random() * 4, vz: d.z * 14, size: 0.16, sizeEnd: 0.03, life: 0.35, r: c.r, g: c.g, b: c.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 2 });
  }
  for (let i = 0; i < 12; i++) {
    const s = Math.random() * len;
    g.engine.dust.spawn({ x: origin.x + d.x * s, y: gy + 0.3, z: origin.z + d.z * s, vx: d.x * 6, vy: 1 + Math.random() * 2, vz: d.z * 6, size: 0.8, sizeEnd: 2.4, life: 0.9, r: 0.4, g: 0.38, b: 0.42, alpha: 0.4, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
  }
  g.engine.glow.spawn({ x: origin.x, y: origin.y, z: origin.z, size: 1.2, sizeEnd: 3.6, life: 0.18, r: core.r, g: core.g, b: core.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  g.sfx.play('explode', origin, 1.2);
  g.shake(owner === g.player ? 0.45 : 0.15);
  return hit;
}
