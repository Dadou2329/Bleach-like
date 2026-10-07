// Urahara's Benihime and Kidō. RazorArc: Kamisori, a thin crimson cutting arc that re-aims at its target
// in flight. HexShield: Chikasumi no Tate, a hexagonal crimson barrier in front of the blade. BloodNet:
// Shibari, a long net of black cords with a crimson glow thrown over the target from above, then pulled
// tight round it. Juzutsunagi: Hiasobi, beads of fire blooming along the net and going off one after
// another like linked mines toward the netted target, ending in a tremendous explosion. TsuppaneRing: a
// tall ring of crimson-pink lightning drawn with the edge; whatever energy reaches it is cancelled.
// The Bankai: the black curtain, and the giant doll Benihime leaning out of it over his shoulders
// (a rigged model whose arms reach, grab and restructure), and the glowing seams it leaves.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { CrescentShape, SphereShape } from '../destruction/shapes';
import { raycastVoxels } from '../voxel/raycast';
import { crescentGeometry, crescentMaterial, type EnergyColors } from './energy';
import { Bolts } from './shunko';
import { groundAt } from './iceArts';
import { CharacterVisual, PropMesh } from '../game/characterFactory';
import { benihimeCurtain, benihimeDoll, DOLL_RES } from '../chars/uraharaBankai';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

export const CRIMSON: EnergyColors = { core: '#FFD6DC', body: '#D01E3C', rim: '#7A0F1C' };
export const RAZOR: EnergyColors = { core: '#FFE6EA', body: '#E0203A', rim: '#8A1F2A' };

const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);

// ------------------------------------------------------------------ Kamisori

/** Kamisori, Benihime: a thin crimson arc that turns toward its target in flight. */
export class RazorArc implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  readonly dir: THREE.Vector3;
  private group = new THREE.Group();
  private mat: THREE.ShaderMaterial;
  private t = 0;
  private travelled = 0;
  private hit = new Set<number>();
  private side = new THREE.Vector3();

  constructor(private g: Game, readonly owner: Fighter, origin: THREE.Vector3, dir: THREE.Vector3, readonly target: Fighter | null, readonly damage = 34, readonly radius = 1.6) {
    this.pos = origin.clone();
    this.dir = dir.clone().normalize();
    const geo = crescentGeometry(radius, 1.0, 0.3, radius * 0.12, 0.18);
    this.mat = crescentMaterial(RAZOR);
    const mesh = new THREE.Mesh(geo, this.mat);
    mesh.renderOrder = 6;
    mesh.frustumCulled = false;
    this.group.add(mesh);
    g.engine.gr.scene.add(this.group);
    g.sfx.play('swing', origin, 0.9);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const tg = this.target;
    if (tg && !tg.dead && !this.hit.has(tg.id)) {
      // re-aimed in flight: it turns hard toward the target
      const want = _v.subVectors(tg.center(), this.pos).normalize();
      this.dir.lerp(want, Math.min(1, dt * 7)).normalize();
    }
    const step = 46 * dt;
    this.pos.addScaledVector(this.dir, step);
    this.travelled += step;
    this.side.crossVectors(UP, this.dir);
    if (this.side.lengthSq() < 1e-4) this.side.set(1, 0, 0);
    this.side.normalize();
    const center = this.pos.clone().addScaledVector(this.dir, -this.radius);
    g.engine.destruction.carve(new CrescentShape(center, this.dir.clone(), this.side.clone(), this.radius, 1.0, 0.16, 0.1), { mode: 'cut', power: 320, dir: this.dir.clone(), sparks: [0.88, 0.13, 0.23], dust: 0.4 });
    for (const f of g.enemiesOf(this.owner)) {
      if (this.hit.has(f.id)) continue;
      if (f.center().distanceTo(this.pos) > f.def.radius + this.radius * 0.7) continue;
      this.hit.add(f.id);
      g.damage(f, this.damage, this.owner, this.dir.clone().setY(0).normalize(), { energy: true, knock: 6, launch: 1, hitstop: 0.06, shake: 0.2, color: '#E0203A' });
      g.sparks(f.center(), this.dir, '#E0203A', 14);
    }
    if (Math.random() < 0.8) g.engine.glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: -this.dir.x * 5, vy: -this.dir.y * 5, vz: -this.dir.z * 5, size: 0.3, sizeEnd: 0.03, life: 0.18, r: 0.95, g: 0.25, b: 0.3, alpha: 0.8, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
    if (this.travelled > 70 || this.t > 3) this.done = true;
  }

  render(_dt: number, time: number): void {
    const c = _v.copy(this.pos).addScaledVector(this.dir, -this.radius);
    this.group.position.copy(c);
    const n = new THREE.Vector3().crossVectors(this.dir, this.side).normalize();
    _m.makeBasis(this.side, n, this.dir);
    this.group.quaternion.setFromRotationMatrix(_m);
    this.mat.uniforms.uTime.value = time;
    this.mat.uniforms.uA.value = Math.min(1, this.t / 0.06);
  }

  dispose(): void {
    this.group.removeFromParent();
    this.mat.dispose();
  }
}

// ------------------------------------------------------------------ Chikasumi no Tate

/** Chikasumi no Tate: a hexagonal crimson barrier standing in front of the blade. */
export class HexShield implements Projectile {
  done = false;
  private t = 0;
  private group = new THREE.Group();
  private fill: THREE.Mesh;
  private lines: THREE.LineSegments;
  private fillMat: THREE.MeshBasicMaterial;
  private lineMat: THREE.LineBasicMaterial;
  /** a blow landed on it (flash) */
  private hitT = 0;

  constructor(private g: Game, readonly owner: Fighter, readonly dur = 1.0, readonly size = 1.5) {
    // a honeycomb of hexagons inside a big hexagon
    const pos: number[] = [];
    const cells: [number, number][] = [];
    const hr = 0.32;
    for (let q = -3; q <= 3; q++)
      for (let r = -3; r <= 3; r++) {
        const x = hr * 1.5 * q, y = hr * Math.sqrt(3) * (r + q / 2);
        if (Math.hypot(x, y) > size - hr * 0.6) continue;
        cells.push([x, y]);
      }
    for (const [cx, cy] of cells)
      for (let i = 0; i < 6; i++) {
        const a0 = (i / 6) * Math.PI * 2, a1 = ((i + 1) / 6) * Math.PI * 2;
        pos.push(cx + Math.cos(a0) * hr, cy + Math.sin(a0) * hr, 0, cx + Math.cos(a1) * hr, cy + Math.sin(a1) * hr, 0);
      }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    this.lineMat = new THREE.LineBasicMaterial({ color: new THREE.Color('#FF5A6E').multiplyScalar(2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    this.lines = new THREE.LineSegments(lg, this.lineMat);
    const fg = new THREE.CircleGeometry(size, 6);
    fg.rotateZ(Math.PI / 6);
    this.fillMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#B3122E'), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.fill = new THREE.Mesh(fg, this.fillMat);
    this.group.add(this.fill, this.lines);
    this.group.traverse((o) => { o.frustumCulled = false; o.renderOrder = 7; });
    g.engine.gr.scene.add(this.group);
    g.sfx.play('ting', owner.center(), 0.8);
  }

  /** something struck the shield */
  flash(): void {
    this.hitT = 0.15;
  }

  update(dt: number): void {
    this.t += dt;
    this.hitT = Math.max(0, this.hitT - dt);
    if (this.t > this.dur + 0.2 || this.owner.dead) this.done = true;
  }

  render(): void {
    const f = this.owner;
    const fw = f.forward(_v);
    this.group.position.copy(f.center()).addScaledVector(fw, 0.9);
    this.group.position.y += 0.15;
    this.group.rotation.set(0, f.yaw, 0);
    const grow = Math.min(1, this.t / 0.08);
    const fade = this.t > this.dur ? Math.max(0, 1 - (this.t - this.dur) / 0.2) : 1;
    this.group.scale.setScalar(0.4 + 0.6 * grow);
    this.fillMat.opacity = (0.32 + this.hitT * 2.5) * fade;
    this.lineMat.opacity = (0.85 + Math.sin(this.t * 40) * 0.1) * fade;
  }

  dispose(): void {
    this.group.removeFromParent();
    this.lines.geometry.dispose();
    this.fill.geometry.dispose();
    this.fillMat.dispose();
    this.lineMat.dispose();
  }
}

// ------------------------------------------------------------------ Shibari, Hiasobi

const NET_U = 9, NET_V = 9;

/** Shibari, Benihime: a long net of black cords glowing crimson, thrown down over the target, then pulled tight. */
export class BloodNet implements Projectile {
  done = false;
  private t = 0;
  private lines: THREE.LineSegments;
  private glowLines: THREE.LineSegments;
  private pos: Float32Array;
  private hold = new THREE.Vector3();
  caught = false;
  /** the Hiasobi fuse has been lit: the net no longer lets go on its own */
  lit = false;

  constructor(private g: Game, readonly owner: Fighter, readonly target: Fighter, readonly dur = 2.6) {
    const segs = NET_U * (NET_V - 1) + NET_V * (NET_U - 1);
    this.pos = new Float32Array(segs * 6);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#1C1418', transparent: true, opacity: 1, depthWrite: true }));
    this.glowLines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: new THREE.Color('#C8102E').multiplyScalar(1.8), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.lines.frustumCulled = this.glowLines.frustumCulled = false;
    this.glowLines.renderOrder = 6;
    g.engine.gr.scene.add(this.lines, this.glowLines);
    this.hold.copy(target.pos);
  }

  /** the corners of the net (for the fire beads) */
  points(): THREE.Vector3[] {
    const out: THREE.Vector3[] = [];
    for (let i = 0; i < this.pos.length; i += 6) out.push(new THREE.Vector3(this.pos[i], this.pos[i + 1], this.pos[i + 2]));
    return out;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const tg = this.target;
    if (!this.caught && this.t >= 0.3) {
      this.caught = true;
      this.hold.copy(tg.pos);
      if (!tg.dead) g.damage(tg, 14, this.owner, new THREE.Vector3(), { knock: 0, hitstop: 0.06, shake: 0.2, color: '#C8102E' });
      g.sfx.play('crack', tg.center(), 0.8);
    }
    if (this.caught && !tg.dead && (this.t < this.dur + 0.3 || this.lit)) {
      tg.body.pos.x = this.hold.x;
      tg.body.pos.z = this.hold.z;
      tg.body.vel.set(0, Math.min(0, tg.body.vel.y), 0);
      tg.push.set(0, 0, 0);
      tg.hitstun = Math.max(tg.hitstun, 0.25);
      tg.hovering = false;
    }
    if ((this.t > this.dur + 0.3 && !this.lit) || (tg.dead && this.t > 0.4) || this.t > 6) this.done = true;
  }

  render(): void {
    const tg = this.target;
    const c = tg.center();
    // falling from above, then drawn tight round the body
    const fall = Math.min(1, this.t / 0.3);
    const tight = this.caught ? Math.min(1, (this.t - 0.3) / 0.25) : 0;
    const h = tg.def.height;
    const R = THREE.MathUtils.lerp(1.9, tg.def.radius + 0.1, tight);
    const node = (u: number, v: number, out: THREE.Vector3) => {
      // a sheet over the target, wrapping round it as it tightens
      const a = (u / (NET_U - 1) - 0.5) * Math.PI * (1.2 + tight * 0.8);
      const y = THREE.MathUtils.lerp(c.y + h * 0.7 + (1 - fall) * 6, c.y - h * 0.45 + (v / (NET_V - 1)) * h * 1.1, Math.max(fall * 0.4, tight));
      const sag = Math.sin((v / (NET_V - 1)) * Math.PI) * 0.3 * (1 - tight);
      return out.set(c.x + Math.sin(a + this.owner.yaw) * (R + sag), y + (1 - tight) * (v / (NET_V - 1)) * 0.6, c.z + Math.cos(a + this.owner.yaw) * (R + sag));
    };
    const A = new THREE.Vector3(), Bv = new THREE.Vector3();
    let k = 0;
    for (let v = 0; v < NET_V; v++)
      for (let u = 0; u < NET_U - 1; u++) {
        node(u, v, A); node(u + 1, v, Bv);
        this.pos.set([A.x, A.y, A.z, Bv.x, Bv.y, Bv.z], k); k += 6;
      }
    for (let u = 0; u < NET_U; u++)
      for (let v = 0; v < NET_V - 1; v++) {
        node(u, v, A); node(u, v + 1, Bv);
        this.pos.set([A.x, A.y, A.z, Bv.x, Bv.y, Bv.z], k); k += 6;
      }
    (this.lines.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    const fade = this.t > this.dur && !this.lit ? Math.max(0, 1 - (this.t - this.dur) / 0.3) : 1;
    (this.lines.material as THREE.LineBasicMaterial).opacity = fade;
    (this.glowLines.material as THREE.LineBasicMaterial).opacity = (0.45 + Math.sin(this.t * 18) * 0.15) * fade;
  }

  dispose(): void {
    this.lines.removeFromParent();
    this.glowLines.removeFromParent();
    this.lines.geometry.dispose();
    (this.lines.material as THREE.Material).dispose();
    (this.glowLines.material as THREE.Material).dispose();
  }
}

/**
 * Hiasobi, Benihime, Juzutsunagi: beads of fire bloom along a line from where the blade was stabbed down
 * to the netted target and go off one after another, a domino run that ends in a tremendous explosion on
 * the target.
 */
export class Juzutsunagi implements Projectile {
  done = false;
  private t = 0;
  private beads: { p: THREE.Vector3; at: number; gone: boolean; mesh: THREE.Mesh }[] = [];
  private mat: THREE.MeshBasicMaterial;
  private finalAt: number;
  private blasted = false;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, readonly net: BloodNet, readonly damage = 150) {
    const to = net.target.pos.clone();
    const d = to.clone().sub(from);
    const len = d.length();
    const n = Math.max(6, Math.min(26, Math.round(len / 0.9)));
    this.mat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#F37436').multiplyScalar(2.2), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    const geo = new THREE.SphereGeometry(0.16, 8, 6);
    const side = new THREE.Vector3(-d.z, 0, d.x).normalize();
    for (let i = 0; i < n; i++) {
      const u = (i + 1) / (n + 1);
      // the beads run in a gentle zigzag along the ground
      const p = from.clone().addScaledVector(d, u).addScaledVector(side, Math.sin(i * 1.7) * 0.5);
      p.y = (groundAt(g, p.x, p.y + 2, p.z, 6) ?? p.y) + 0.2;
      const m = new THREE.Mesh(geo, this.mat);
      m.position.copy(p);
      m.scale.setScalar(0.01);
      m.frustumCulled = false;
      g.engine.gr.scene.add(m);
      this.beads.push({ p, at: 0.35 + i * 0.06, gone: false, mesh: m });
    }
    // the net blooms with fire too
    for (const q of net.points().filter((_, i) => i % 3 === 0)) {
      const m = new THREE.Mesh(geo, this.mat);
      m.position.copy(q);
      m.scale.setScalar(0.01);
      m.frustumCulled = false;
      g.engine.gr.scene.add(m);
      this.beads.push({ p: q, at: 0.35 + n * 0.06 - 0.1 + Math.random() * 0.08, gone: false, mesh: m });
    }
    this.finalAt = 0.35 + n * 0.06 + 0.06;
    net.lit = true;
    g.sfx.play('charge', from, 0.8);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    for (const b of this.beads) {
      if (b.gone || this.t < b.at) continue;
      b.gone = true;
      b.mesh.visible = false;
      g.engine.destruction.carve(new SphereShape(b.p.clone(), 0.55, 0.8), { mode: 'explode', power: 160, impulse: 8, dust: 0.3 });
      g.engine.glow.spawn({ x: b.p.x, y: b.p.y, z: b.p.z, size: 0.5, sizeEnd: 1.8, life: 0.22, r: 1, g: 0.55, b: 0.25, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
      g.engine.dust.spawn({ x: b.p.x, y: b.p.y, z: b.p.z, vy: 1.5, size: 0.6, sizeEnd: 1.6, life: 0.8, r: 0.35, g: 0.3, b: 0.3, alpha: 0.4, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
      g.sfx.play('impact', b.p, 0.5);
    }
    if (!this.blasted && this.t >= this.finalAt) this.blast(g);
    if (this.blasted && this.t > this.finalAt + 0.6) this.done = true;
  }

  private blast(g: Game): void {
    this.blasted = true;
    const tg = this.net.target;
    const c = tg.dead ? this.net.target.pos.clone() : tg.center();
    this.net.done = true;
    for (const f of g.enemiesOf(this.owner)) {
      const d = f.center().distanceTo(c);
      if (d > 4.2 + f.def.radius) continue;
      g.damage(f, f === tg ? this.damage : this.damage * 0.5, this.owner, f.pos.clone().sub(c).setY(0).normalize(), { energy: true, knock: 12, launch: 9, heavy: true, hitstop: 0.16, shake: 0.7, color: '#F37436' });
    }
    g.engine.destruction.carve(new SphereShape(c.clone(), 3.6, 0.85), { mode: 'explode', power: 520, impulse: 18 });
    g.addRing(c.clone().setY(tg.pos.y + 0.1), 14, '#F37436', 0.55);
    g.sfx.play('explode', c, 2.2);
    g.shake(0.8);
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * Math.PI * 2, e = Math.random() * 2 - 1, q = Math.sqrt(1 - e * e), s = 4 + Math.random() * 12;
      const hot = Math.random() < 0.4;
      g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: Math.cos(a) * q * s, vy: Math.abs(e) * s + 2, vz: Math.sin(a) * q * s, size: hot ? 0.9 : 1.6, sizeEnd: hot ? 0.1 : 3.2, life: 0.5 + Math.random() * 0.4, r: 1, g: hot ? 0.87 : 0.5, b: hot ? 0.63 : 0.22, alpha: 0.9, alphaEnd: 0, tex: hot ? TEX_GLOW : TEX_PUFF, drag: 2.2 });
    }
    g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 4, sizeEnd: 12, life: 0.35, r: 1, g: 0.85, b: 0.6, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  }

  render(): void {
    for (const b of this.beads) {
      if (b.gone) continue;
      const k = Math.max(0, Math.min(1, (this.t - (b.at - 0.3)) / 0.25));
      b.mesh.scale.setScalar(0.01 + k * (1 + Math.sin(this.t * 30 + b.at * 50) * 0.15));
    }
  }

  dispose(): void {
    for (const b of this.beads) b.mesh.removeFromParent();
    this.beads[0]?.mesh.geometry.dispose();
    this.mat.dispose();
  }
}

// ------------------------------------------------------------------ Tsuppane

/** Tsuppane, Benihime: a tall ring of crimson-pink lightning before him; energy that reaches it dies. */
export class TsuppaneRing implements Projectile {
  done = false;
  private t = 0;
  private bolts: Bolts;
  private flick = 0;
  readonly center = new THREE.Vector3();

  constructor(private g: Game, readonly owner: Fighter, readonly dur = 1.2, readonly radius = 1.3) {
    this.bolts = new Bolts(g.engine.gr.scene, 160, '#F7DADB');
    g.sfx.play('crack', owner.center(), 0.8);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const f = this.owner;
    this.center.copy(f.center()).addScaledVector(f.forward(_v), 1.0);
    // cancel the energy that reaches the ring
    if (this.t < this.dur)
      for (const p of g.projectiles as (Projectile & { pos?: THREE.Vector3; owner?: Fighter })[]) {
        if (p === this || p.done || !(p.pos instanceof THREE.Vector3) || p.owner === f) continue;
        if (p.pos.distanceTo(this.center) > this.radius + 1.2) continue;
        p.done = true;
        g.sparks(p.pos.clone(), f.forward(new THREE.Vector3()), '#E0506E', 16);
        g.sfx.play('ting', p.pos, 1);
        g.engine.glow.spawn({ x: p.pos.x, y: p.pos.y, z: p.pos.z, size: 1, sizeEnd: 2.6, life: 0.2, r: 0.97, g: 0.6, b: 0.7, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
      }
    if (this.t > this.dur + 0.15 || f.dead) this.done = true;
  }

  render(dt: number): void {
    const f = this.owner;
    const k = this.t > this.dur ? Math.max(0, 1 - (this.t - this.dur) / 0.15) : Math.min(1, this.t / 0.1);
    this.bolts.lines.visible = k > 0.02;
    this.flick -= dt;
    if (this.flick > 0 || k <= 0.02) return;
    this.flick = 0.04;
    const side = new THREE.Vector3(-f.forward(_v).z, 0, f.forward(_v).x);
    const ring = (a: number) => this.center.clone().addScaledVector(side, Math.cos(a) * this.radius).add(new THREE.Vector3(0, Math.sin(a) * this.radius * 1.25, 0));
    this.bolts.begin();
    const n = 18;
    for (let i = 0; i < n; i++) {
      if (Math.random() > 0.85) continue;
      this.bolts.bolt(ring((i / n) * Math.PI * 2), ring(((i + 1) / n) * Math.PI * 2), 0.1, 3);
    }
    for (let i = 0; i < 4; i++) {
      const a = Math.random() * Math.PI * 2;
      const p = ring(a);
      this.bolts.bolt(p, p.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8)), 0.1, 3);
    }
    this.bolts.end();
    this.bolts.mat.opacity = k;
    const p = ring(Math.random() * Math.PI * 2);
    this.g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.35, sizeEnd: 0.05, life: 0.1, r: 0.88, g: 0.31, b: 0.43, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  }

  dispose(): void {
    this.bolts.dispose();
  }
}

// ------------------------------------------------------------------ the Bankai

/**
 * Kannonbiraki Benihime Aratame: the black curtain behind him and the doll leaning out of it. The doll is
 * a rigged giant; `reach(p, k)` sends one of her hands toward a point (k = 0 rest, 1 there), `cup` brings
 * both hands together round a point (the doors closing). Follows the owner.
 */
export class BenihimeBankai implements Projectile {
  done = false;
  level = 0;
  private t = 0;
  private doll: CharacterVisual;
  private curtain: PropMesh;
  private bones = new Map<string, THREE.Bone>();
  private rest = new Map<string, THREE.Quaternion>();
  /** world-space reach targets for each hand (null = rest) */
  private reachL: { p: THREE.Vector3; k: number } | null = null;
  private reachR: { p: THREE.Vector3; k: number } | null = null;
  private ending = false;
  private endT = 0;
  readonly anchor = new THREE.Vector3();
  private yaw = 0;

  constructor(private g: Game, readonly owner: Fighter) {
    this.doll = new CharacterVisual(benihimeDoll().model, [], []);
    this.curtain = new PropMesh(benihimeCurtain());
    for (const n of ['torso', 'head', 'upperarm.L', 'forearm.L', 'hand.L', 'upperarm.R', 'forearm.R', 'hand.R']) {
      const b = this.doll.rig.bone(n);
      this.bones.set(n, b);
      this.rest.set(n, b.quaternion.clone());
    }
    g.engine.gr.scene.add(this.doll.object, this.curtain);
    this.yaw = owner.yaw;
    this.place(1);
  }

  /** Send a hand toward p (world), weight k 0..1. */
  reach(side: 'L' | 'R', p: THREE.Vector3 | null, k = 1): void {
    const r = p ? { p: p.clone(), k } : null;
    if (side === 'L') this.reachL = r;
    else this.reachR = r;
  }

  /** The curtain closes: she withdraws. */
  end(): void {
    this.ending = true;
    this.endT = 0;
  }

  update(dt: number): void {
    this.t += dt;
    if (this.ending) {
      this.endT += dt;
      if (this.endT > 1.2) this.done = true;
    }
  }

  private place(lerp: number): void {
    const f = this.owner;
    // she stays behind him, turning slowly with him
    let d = f.yaw - this.yaw;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    this.yaw += d * lerp;
    const back = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this.anchor.copy(f.renderPos).addScaledVector(back, 3.2);
    this.curtain.position.copy(this.anchor).addScaledVector(back, 0.9);
    this.curtain.rotation.set(0, this.yaw, 0);
  }

  render(dt: number, time: number): void {
    this.place(Math.min(1, dt * 2.5));
    const appear = this.ending ? Math.max(0, 1 - this.endT / 1.0) : Math.min(1, this.t / 1.2);
    this.level = appear;
    // the curtain drops from above, then she leans out through it
    const drop = Math.min(1, this.t / 0.5);
    this.curtain.scale.set(1, this.ending ? Math.max(0.01, 1 - this.endT / 1.2) : 0.05 + drop * 0.95, 1);
    const curtainTop = 12.5;
    this.curtain.position.y = this.anchor.y + curtainTop * (1 - this.curtain.scale.y);
    const lean = Math.min(1, Math.max(0, (this.t - 0.6) / 0.9)) * appear;
    // seen from behind (the camera over his shoulder), the curtain would wall off the screen: it is
    // only there for whoever faces him; the doll thins out instead of blocking the view
    const cam = this.g.engine.gr.camera.position;
    const bx = -Math.sin(this.yaw), bz = -Math.cos(this.yaw);
    const behindCurtain = (cam.x - this.curtain.position.x) * bx + (cam.z - this.curtain.position.z) * bz > -0.6;
    const behindDoll = (cam.x - this.anchor.x) * bx + (cam.z - this.anchor.z) * bz > -1.5;
    this.curtain.visible = !behindCurtain;
    (this.doll.material.userData.uniforms as { uDissolve: { value: number } }).uDissolve.value = behindDoll ? 0.55 : 0;
    const o = this.doll.object;
    o.position.copy(this.anchor);
    o.position.y += 1.2 - (1 - lean) * 3;
    o.rotation.set(0, this.yaw, 0);
    o.visible = lean > 0.01;
    // her body leans forward over him and sways a little
    const torso = this.bones.get('torso')!;
    torso.quaternion.copy(this.rest.get('torso')!).multiply(_q.setFromEuler(new THREE.Euler(0.42 * lean + Math.sin(time * 0.7) * 0.03, Math.sin(time * 0.4) * 0.05, 0)));
    const head = this.bones.get('head')!;
    head.quaternion.copy(this.rest.get('head')!).multiply(_q.setFromEuler(new THREE.Euler(0.25 * lean, Math.sin(time * 0.5) * 0.08, Math.sin(time * 0.3) * 0.04)));
    o.updateMatrixWorld(true);
    this.arm('L', this.reachL, time, lean);
    this.arm('R', this.reachR, time, lean);
    this.doll.object.updateMatrixWorld(true);
    void dt;
  }

  /** Aim one arm: shoulder pitched/yawed so the hand points at the target, the elbow easing straight. */
  private arm(side: 'L' | 'R', r: { p: THREE.Vector3; k: number } | null, time: number, lean: number): void {
    const up = this.bones.get(`upperarm.${side}`)!, fo = this.bones.get(`forearm.${side}`)!, ha = this.bones.get(`hand.${side}`)!;
    const s = side === 'L' ? 1 : -1;
    // rest: the arms hang forward over his head, hands open, slowly breathing
    const restE = new THREE.Euler(-0.9 * lean + Math.sin(time * 0.6 + s) * 0.05, 0, s * 0.25);
    up.quaternion.copy(this.rest.get(`upperarm.${side}`)!).multiply(_q.setFromEuler(restE));
    fo.quaternion.copy(this.rest.get(`forearm.${side}`)!).multiply(_q.setFromEuler(new THREE.Euler(-0.5 * lean, 0, 0)));
    ha.quaternion.copy(this.rest.get(`hand.${side}`)!).multiply(_q.setFromEuler(new THREE.Euler(-0.3 * lean, 0, 0)));
    if (!r || r.k <= 0) return;
    // reach: turn the shoulder so the arm (hanging down its bone's −Y) points at the target
    up.parent!.updateMatrixWorld(true);
    up.updateMatrixWorld(true);
    const sp = up.getWorldPosition(new THREE.Vector3());
    const want = r.p.clone().sub(sp).normalize();
    const parentQ = up.parent!.getWorldQuaternion(new THREE.Quaternion());
    const local = want.applyQuaternion(parentQ.clone().invert());
    const aim = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), local);
    up.quaternion.slerp(aim.multiply(this.rest.get(`upperarm.${side}`)!), r.k);
    fo.quaternion.slerp(this.rest.get(`forearm.${side}`)!, r.k * 0.85);
  }

  /** world position of a hand (for grabs) */
  hand(side: 'L' | 'R', out = new THREE.Vector3()): THREE.Vector3 {
    const b = this.bones.get(`hand.${side}`)!;
    b.updateWorldMatrix(true, false);
    // the palm sits a little down the hand bone
    return out.set(0, -14 / DOLL_RES, 0).applyMatrix4(b.matrixWorld);
  }

  dispose(): void {
    this.doll.object.removeFromParent();
    this.curtain.removeFromParent();
    this.curtain.material.dispose();
  }
}

/** A glowing seam (stitches) laid across a target or along the ground: dark thread, an orange-red glow. */
export class Seam implements Projectile {
  done = false;
  private t = 0;
  private lines: THREE.LineSegments;
  private glow: THREE.LineSegments;
  private pos: Float32Array;

  constructor(private g: Game, readonly a: THREE.Vector3, readonly b: THREE.Vector3, readonly life = 2.5, readonly follow: Fighter | null = null) {
    const n = Math.max(6, Math.round(a.distanceTo(b) / 0.18));
    this.pos = new Float32Array((n + n) * 6);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#241418' }));
    this.glow = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: new THREE.Color('#FF7A4A').multiplyScalar(2), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.lines.frustumCulled = this.glow.frustumCulled = false;
    this.glow.renderOrder = 6;
    g.engine.gr.scene.add(this.lines, this.glow);
    this.build(n);
  }

  private off = new THREE.Vector3();

  private build(n: number): void {
    const d = this.b.clone().sub(this.a);
    const side = new THREE.Vector3(-d.z, 0, d.x).normalize().multiplyScalar(0.07);
    let k = 0;
    for (let i = 0; i < n; i++) {
      const p0 = this.a.clone().addScaledVector(d, i / n).add(this.off), p1 = this.a.clone().addScaledVector(d, (i + 1) / n).add(this.off);
      this.pos.set([p0.x, p0.y, p0.z, p1.x, p1.y, p1.z], k); k += 6;
      // the cross-ticks of the stitches
      const m = p0.clone().lerp(p1, 0.5);
      this.pos.set([m.x - side.x, m.y + 0.05, m.z - side.z, m.x + side.x, m.y - 0.05, m.z + side.z], k); k += 6;
    }
    (this.lines.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  update(dt: number): void {
    this.t += dt;
    if (this.t > this.life) this.done = true;
  }

  render(): void {
    if (this.follow && !this.follow.dead) {
      // the seam rides on the body it was laid across
      this.off.copy(this.follow.renderPos).sub(this.a).setY(0).multiplyScalar(0);
    }
    const k = this.t > this.life - 0.3 ? Math.max(0, (this.life - this.t) / 0.3) : Math.min(1, this.t / 0.1);
    (this.glow.material as THREE.LineBasicMaterial).opacity = 0.8 * k * (0.8 + Math.sin(this.t * 20) * 0.2);
    this.lines.visible = k > 0.05;
  }

  dispose(): void {
    this.lines.removeFromParent();
    this.glow.removeFromParent();
    this.lines.geometry.dispose();
    (this.lines.material as THREE.Material).dispose();
    (this.glow.material as THREE.Material).dispose();
  }
}

export function crimsonBurst(g: Game, p: THREE.Vector3, size = 1): void {
  g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.6 * size, sizeEnd: 2.4 * size, life: 0.2, r: 1, g: 0.35, b: 0.42, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  for (let i = 0; i < 10 * size; i++) {
    const a = Math.random() * Math.PI * 2, e = Math.random() * 2 - 1;
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 6, vy: e * 5, vz: Math.sin(a) * 6, size: 0.12, sizeEnd: 0.02, life: 0.3, r: 0.82, g: 0.12, b: 0.24, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2.5, drag: 2 });
  }
}

export { raycastVoxels };
