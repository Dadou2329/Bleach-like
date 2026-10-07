// Suzumushi's techniques. SoundRings: "Nake, Suzumushi" — the blade rings and thin pink ripples of sound
// spread out on every side. BenihikoRain: Suzumushi Nishiki — the half-circle drawn round him breaks into
// hundreds of thin blades that rise like locusts and rain down on the target. EnmaKorogi: Suzumushi
// Tsuishiki — ten rings thrown out round the field, a black dome pinned down between them, ten kanji of the
// stages of a corpse glowing on it; whoever is inside (except the one holding the hilt) loses every sense
// but touch.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { BoxShape } from '../destruction/shapes';
import { raycastVoxels } from '../voxel/raycast';
import { groundAt } from './iceArts';
import { TEX_GLOW, TEX_STREAK } from './sprites';

const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const _s = new THREE.Vector3(1, 1, 1);
const Z = new THREE.Vector3(0, 0, 1);

/** Tōsen's reiatsu */
export const TOSEN_PINK = '#FF8CC6';

// ------------------------------------------------------------------ Nake

let ringGeo: THREE.TorusGeometry | null = null;

/** Ripples of sound off the ringing blade: thin rings in every orientation, expanding and fading. */
export class SoundRings implements Projectile {
  done = false;
  private t = 0;
  private rings: { m: THREE.Mesh; delay: number; axis: THREE.Quaternion }[] = [];

  constructor(private g: Game, readonly at: () => THREE.Vector3, readonly radius: number, readonly dur = 1.1, color: THREE.ColorRepresentation = TOSEN_PINK) {
    if (!ringGeo) ringGeo = new THREE.TorusGeometry(1, 0.012, 4, 64);
    const col = new THREE.Color(color).multiplyScalar(2.2);
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.frustumCulled = false;
      m.renderOrder = 6;
      const axis = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0));
      this.rings.push({ m, delay: (i % 3) * 0.12 + Math.floor(i / 3) * 0.05, axis });
      g.engine.gr.scene.add(m);
    }
  }

  update(dt: number): void {
    this.t += dt;
    if (this.t > this.dur) this.done = true;
  }

  render(): void {
    const c = this.at();
    for (const r of this.rings) {
      const u = Math.max(0, Math.min(1, (this.t - r.delay) / (this.dur * 0.6)));
      r.m.visible = u > 0 && u < 1;
      if (!r.m.visible) continue;
      const k = 1 - (1 - u) * (1 - u);
      r.m.position.copy(c);
      r.m.quaternion.copy(r.axis);
      r.m.scale.setScalar(0.3 + k * this.radius);
      (r.m.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - u);
    }
  }

  dispose(): void {
    for (const r of this.rings) {
      r.m.removeFromParent();
      (r.m.material as THREE.Material).dispose();
    }
  }
}

// ------------------------------------------------------------------ Benihikō

let bladeGeo: THREE.BufferGeometry | null = null;

interface Blade { p: THREE.Vector3; v: THREE.Vector3; t: number; delay: number; alive: boolean; land: THREE.Vector3 }

/**
 * Hundreds of thin blades loosed off the arc he drew: each rises a little, turns and dives on a point round
 * the target, cutting what it strikes (a nick in a wall, a cut on a fighter).
 */
export class BenihikoRain implements Projectile {
  done = false;
  private t = 0;
  private blades: Blade[] = [];
  private mesh: THREE.InstancedMesh;
  private hits = new Map<number, number>();

  constructor(private g: Game, readonly owner: Fighter, arc: THREE.Vector3[], target: THREE.Vector3, readonly o: { count: number; damage: number; spread: number; maxHitsEach: number }) {
    if (!bladeGeo) {
      // a thin double-edged blade: a flat diamond, long along Z
      const geo = new THREE.BufferGeometry();
      const L = 0.5, W = 0.035, T = 0.006;
      const v = [
        0, 0, L / 2, W, 0, 0, 0, T, 0, 0, 0, L / 2, 0, T, 0, -W, 0, 0, 0, 0, L / 2, -W, 0, 0, 0, -T, 0, 0, 0, L / 2, 0, -T, 0, W, 0, 0,
        0, 0, -L / 2, 0, T, 0, W, 0, 0, 0, 0, -L / 2, -W, 0, 0, 0, T, 0, 0, 0, -L / 2, 0, -T, 0, -W, 0, 0, 0, 0, -L / 2, W, 0, 0, 0, -T, 0,
      ];
      geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
      geo.computeVertexNormals();
      bladeGeo = geo;
    }
    this.mesh = new THREE.InstancedMesh(bladeGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color('#F6F7FA').multiplyScalar(1.6), side: THREE.DoubleSide }), o.count);
    this.mesh.frustumCulled = false;
    this.mesh.count = o.count;
    g.engine.gr.scene.add(this.mesh);
    for (let i = 0; i < o.count; i++) {
      const a = arc[i % arc.length].clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4));
      const ang = Math.random() * Math.PI * 2, rad = Math.sqrt(Math.random()) * o.spread;
      const land = target.clone().add(new THREE.Vector3(Math.cos(ang) * rad, (Math.random() - 0.3) * 1.2, Math.sin(ang) * rad));
      // ballistic: up and out, then down onto the landing point in T seconds
      const T = 0.55 + Math.random() * 0.35;
      const gr = 14;
      const v = new THREE.Vector3().subVectors(land, a).divideScalar(T);
      v.y += 0.5 * gr * T;
      this.blades.push({ p: a, v, t: 0, delay: (i / o.count) * 0.35, alive: true, land });
    }
  }

  update(dt: number): void {
    const g = this.g;
    this.t += dt;
    let alive = 0;
    for (const b of this.blades) {
      if (!b.alive) continue;
      alive++;
      if (this.t < b.delay) continue;
      b.t += dt;
      const step = b.v.length() * dt;
      const dir = _v.copy(b.v).normalize();
      // the world: a nick where it strikes
      const hit = raycastVoxels(g.engine.world, b.p.x, b.p.y, b.p.z, dir.x, dir.y, dir.z, step + 0.1);
      if (hit && b.t > 0.08) {
        b.p.addScaledVector(dir, hit.dist);
        _q.setFromUnitVectors(Z, dir);
        g.engine.destruction.carve(new BoxShape(b.p.clone(), new THREE.Vector3(0.05, 0.25, 0.3), _q.clone()), { mode: 'cut', power: 260, dir: dir.clone(), sparks: [1, 0.55, 0.7], dust: 0.15 });
        b.alive = false;
        continue;
      }
      // fighters on its path
      for (const f of g.enemiesOf(this.owner)) {
        if (f.dead) continue;
        const n = this.hits.get(f.id) ?? 0;
        if (n >= this.o.maxHitsEach) continue;
        const cy = Math.max(f.pos.y + 0.1, Math.min(f.pos.y + f.def.height, b.p.y));
        if (Math.hypot(f.pos.x - b.p.x, cy - b.p.y, f.pos.z - b.p.z) > f.def.radius + 0.25) continue;
        this.hits.set(f.id, n + 1);
        g.damage(f, this.o.damage, this.owner, dir.clone().setY(0).normalize(), { knock: 0.8, quiet: n % 3 !== 0, hitstop: 0.01, color: TOSEN_PINK });
        g.engine.glow.spawn({ x: b.p.x, y: b.p.y, z: b.p.z, vx: dir.x * 3, vy: 2, vz: dir.z * 3, size: 0.1, sizeEnd: 0.02, life: 0.25, r: 1, g: 0.3, b: 0.45, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
        b.alive = false;
        break;
      }
      if (!b.alive) continue;
      b.p.addScaledVector(b.v, dt);
      b.v.y -= 14 * dt;
      if (b.t > 2.2) b.alive = false;
      // a crimson glint trailing some of them
      if (Math.random() < 0.08) g.engine.glow.spawn({ x: b.p.x, y: b.p.y, z: b.p.z, vx: -b.v.x * 0.1, vy: -b.v.y * 0.1, vz: -b.v.z * 0.1, size: 0.08, sizeEnd: 0.01, life: 0.2, r: 1, g: 0.2, b: 0.35, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
    }
    if (alive === 0 || this.t > 4) this.done = true;
  }

  render(): void {
    let i = 0;
    for (const b of this.blades) {
      if (!b.alive || this.t < b.delay) _s.setScalar(0);
      else _s.setScalar(1);
      _q.setFromUnitVectors(Z, _v.copy(b.v).normalize());
      _m.compose(b.p, _q, _s);
      this.mesh.setMatrixAt(i++, _m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    (this.mesh.material as THREE.Material).dispose();
  }
}

// ------------------------------------------------------------------ Enma Kōrogi

const KANJI = ['脹', '壊', '血', '爛', '瘀', '青', '噉', '散', '骨', '焼'];
let kanjiTex: THREE.CanvasTexture[] | null = null;

function kanjiTextures(): THREE.CanvasTexture[] {
  if (kanjiTex) return kanjiTex;
  kanjiTex = KANJI.map((k) => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d')!;
    x.clearRect(0, 0, 128, 128);
    x.fillStyle = '#F7F2E0';
    x.font = 'bold 96px "Noto Serif JP", "Hiragino Mincho ProN", serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.shadowColor = '#FFE9A0';
    x.shadowBlur = 12;
    x.fillText(k, 64, 70);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
  return kanjiTex;
}

/**
 * The Bankai's field: ten rings thrown out from him to a circle round the place, planted upright; the black
 * dome drawn up between them, pinned with guylines, the kanji glowing over the rings. `inside(p)` tells the kit
 * who is blinded; `shred()` tears it apart.
 */
export class EnmaKorogi implements Projectile {
  done = false;
  private t = 0;
  private endT = -1;
  private rings: { m: THREE.Mesh; from: THREE.Vector3; to: THREE.Vector3; k: THREE.Mesh }[] = [];
  private dome: THREE.Mesh;
  private lines: THREE.LineSegments;
  readonly centre: THREE.Vector3;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, readonly radius: number) {
    this.centre = owner.pos.clone();
    const gy = groundAt(g, this.centre.x, this.centre.y + 1, this.centre.z, 6);
    if (gy !== null) this.centre.y = gy;
    if (!ringGeo) ringGeo = new THREE.TorusGeometry(1, 0.012, 4, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFF3C2').multiplyScalar(2.2), transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
    const ringMesh = new THREE.TorusGeometry(1, 0.06, 6, 40);
    const tex = kanjiTextures();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const to = new THREE.Vector3(this.centre.x + Math.cos(a) * radius, this.centre.y, this.centre.z + Math.sin(a) * radius);
      const ty = groundAt(g, to.x, to.y + 6, to.z, 14);
      if (ty !== null) to.y = ty;
      const m = new THREE.Mesh(ringMesh, ringMat);
      m.frustumCulled = false;
      g.engine.gr.scene.add(m);
      const k = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex[i], color: new THREE.Color(1.6, 1.5, 1.2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      k.frustumCulled = false;
      g.engine.gr.scene.add(k);
      this.rings.push({ m, from: from.clone(), to, k });
    }
    // the dome: black, seen from outside only (from inside, only the blinded are kept in the dark)
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#050507', side: THREE.FrontSide, transparent: true, opacity: 0 }));
    this.dome.frustumCulled = false;
    this.dome.position.copy(this.centre);
    g.engine.gr.scene.add(this.dome);
    // guylines from each ring to the crown
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(10 * 6), 3));
    this.lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: new THREE.Color('#CFC7A8').multiplyScalar(1.4), transparent: true, opacity: 0 }));
    this.lines.frustumCulled = false;
    g.engine.gr.scene.add(this.lines);
  }

  /** the dome is up (blinding) */
  get active(): boolean {
    return this.t > 1.1 && this.endT < 0;
  }

  inside(p: THREE.Vector3): boolean {
    const dx = p.x - this.centre.x, dz = p.z - this.centre.z, dy = Math.max(0, p.y - this.centre.y);
    return Math.hypot(dx, dz, dy) < this.radius;
  }

  shred(): void {
    if (this.endT < 0) {
      this.endT = 0;
      this.g.sfx.play('shatter', this.centre, 1);
    }
  }

  update(dt: number): void {
    this.t += dt;
    if (this.endT >= 0) {
      this.endT += dt;
      if (this.endT > 1.2) this.done = true;
    }
  }

  render(_dt: number, time: number): void {
    const g = this.g;
    const fling = Math.min(1, this.t / 0.6);
    const raise = Math.max(0, Math.min(1, (this.t - 0.55) / 0.55));
    const fade = this.endT >= 0 ? Math.max(0, 1 - this.endT / 1.1) : 1;
    const top = this.centre.y + this.radius;
    const pos = this.lines.geometry.getAttribute('position') as THREE.BufferAttribute;
    this.rings.forEach((r, i) => {
      // thrown out along a low arc, then standing upright at its post, spinning slowly
      const p = _v.lerpVectors(r.from, r.to, fling);
      p.y += Math.sin(fling * Math.PI) * 4 + 1.6 * fling;
      r.m.position.copy(p);
      r.m.scale.setScalar((0.25 + fling * 1.1) * fade);
      r.m.rotation.set(0, Math.atan2(r.to.x - this.centre.x, r.to.z - this.centre.z) + time * 0.6, 0);
      r.m.visible = fade > 0.02;
      // the kanji on the dome over its ring, facing out
      const out = new THREE.Vector3(r.to.x - this.centre.x, 0, r.to.z - this.centre.z).normalize();
      const kp = this.centre.clone().addScaledVector(out, this.radius * 0.83);
      kp.y = this.centre.y + this.radius * 0.55 * raise;
      r.k.position.copy(kp).addScaledVector(out, 0.3);
      r.k.lookAt(kp.clone().addScaledVector(out, 5));
      r.k.scale.setScalar(this.radius * 0.16);
      (r.k.material as THREE.MeshBasicMaterial).opacity = raise * fade * (0.75 + 0.25 * Math.sin(time * 3 + i));
      pos.setXYZ(i * 2, p.x, p.y, p.z);
      pos.setXYZ(i * 2 + 1, this.centre.x + out.x * this.radius * 0.3 * (1 - raise), this.centre.y + 0.3 + (top - this.centre.y) * raise, this.centre.z + out.z * this.radius * 0.3 * (1 - raise));
    });
    pos.needsUpdate = true;
    (this.lines.material as THREE.LineBasicMaterial).opacity = 0.8 * Math.min(fling, fade);
    this.dome.scale.set(this.radius, this.radius * Math.max(0.001, raise), this.radius);
    (this.dome.material as THREE.MeshBasicMaterial).opacity = 0.96 * raise * fade;
    this.dome.visible = raise > 0.01 && fade > 0.01;
    // tearing apart: black shreds flung off it
    if (this.endT >= 0 && this.endT < 0.8) {
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2, e = Math.random() * 1.3;
        const x = this.centre.x + Math.cos(a) * Math.cos(e) * this.radius, y = this.centre.y + Math.sin(e) * this.radius, z = this.centre.z + Math.sin(a) * Math.cos(e) * this.radius;
        g.engine.dust.spawn({ x, y, z, vx: Math.cos(a) * 6, vy: 2 + Math.random() * 3, vz: Math.sin(a) * 6, size: 1.4, sizeEnd: 0.2, life: 1.2, r: 0.03, g: 0.03, b: 0.04, alpha: 0.95, alphaEnd: 0, drag: 0.6, spin: (Math.random() - 0.5) * 6 });
      }
    }
  }

  dispose(): void {
    for (const r of this.rings) {
      r.m.removeFromParent();
      r.k.removeFromParent();
      (r.k.material as THREE.Material).dispose();
    }
    this.dome.removeFromParent();
    (this.dome.material as THREE.Material).dispose();
    this.dome.geometry.dispose();
    this.lines.removeFromParent();
    this.lines.geometry.dispose();
    (this.lines.material as THREE.Material).dispose();
  }
}

void TEX_GLOW;


// ------------------------------------------------------------------ Grillar Grillo

/** The four insect wings beating on their own (after the animator has posed him). */
export class WingFlutter implements Projectile {
  done = false;
  private t = 0;
  /** 0 folded and twitching, 1 beating hard (flight, a leap) */
  beat = 0;
  constructor(readonly owner: Fighter) {}
  update(dt: number): void {
    this.t += dt;
  }
  render(dt: number): void {
    const f = this.owner;
    const rig = f.visual.rig;
    const want = !f.grounded || f.hovering ? 1 : 0.15;
    this.beat += (want - this.beat) * Math.min(1, dt * 6);
    const freq = 3 + this.beat * 22;
    for (const [name, ph, amp] of [['wing.L', 0, 1], ['wing.R', 0, -1], ['wing2.L', 1.3, 1], ['wing2.R', 1.3, -1]] as [string, number, number][]) {
      const i = rig.index(name);
      if (i < 0) continue;
      const a = Math.sin(this.t * freq + ph) * (0.08 + this.beat * 0.55);
      rig.bones[i].quaternion.setFromEuler(new THREE.Euler(0, a * amp * 0.6, a * amp));
    }
  }
  dispose(): void {}
}

/**
 * Los Nueve Aspectos: nine lime-green circles drawn in the air before him one after another; `fire()` releases
 * them as one crushing burst of sound down the line he faces.
 */
export class NueveRings implements Projectile {
  done = false;
  private t = 0;
  private fireT = -1;
  private rings: THREE.Mesh[] = [];
  constructor(private g: Game, readonly at: () => { p: THREE.Vector3; fw: THREE.Vector3 }) {
    if (!ringGeo) ringGeo = new THREE.TorusGeometry(1, 0.012, 4, 64);
    const geo = new THREE.TorusGeometry(1, 0.05, 6, 48);
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color('#A8FF3A').multiplyScalar(2.2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.frustumCulled = false;
      g.engine.gr.scene.add(m);
      this.rings.push(m);
    }
  }
  fire(): void {
    this.fireT = 0;
  }
  update(dt: number): void {
    this.t += dt;
    if (this.fireT >= 0 && (this.fireT += dt) > 0.6) this.done = true;
    if (this.t > 4) this.done = true;
  }
  render(): void {
    const { p, fw } = this.at();
    const side = new THREE.Vector3(fw.z, 0, -fw.x);
    this.rings.forEach((m, i) => {
      // a 3 × 3 sheet of circles before him, each drawn in turn
      const cx = (i % 3) - 1, cy = 1 - Math.floor(i / 3);
      const shown = Math.min(1, Math.max(0, (this.t - i * 0.08) / 0.12));
      const c = p.clone().addScaledVector(side, cx * 1.4).addScaledVector(fw, 2.2);
      c.y += cy * 1.4;
      if (this.fireT >= 0) c.addScaledVector(fw, this.fireT * 40);
      m.position.copy(c);
      m.lookAt(c.clone().add(fw));
      m.scale.setScalar(0.6 * shown * (1 + Math.max(0, this.fireT) * 5));
      (m.material as THREE.MeshBasicMaterial).opacity = shown * (this.fireT >= 0 ? Math.max(0, 1 - this.fireT / 0.6) : 0.9);
    });
  }
  dispose(): void {
    for (const m of this.rings) {
      m.removeFromParent();
      (m.material as THREE.Material).dispose();
    }
  }
}
