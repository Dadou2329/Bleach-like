// Yhwach's effects (docs/roster/H1-vandenreich-leaders.md, "Yhwach"): Heilig Pfeil bursting into a Quincy
// Zeichen; Sankt Bogen, a giant bow of light that forms in the sky and looses one great arrow; Qual Kreis, the
// lightning crackle round the target and the ring of bows that crossfire into it; Blut Vene Anhaben, the shell
// of blue veins that drinks whatever touches it; the grains of sand where he stood when he foresaw a blow;
// shadow blades erupting where the target will be (Traps of Fate) and wounds that bloom later (Future Wound);
// and the Soul King's Black — the eyes opening on him and their beams, the eye-pillars that make a Zeichen
// and the violet blast from its centre, the swarm of one-eyed creatures, Auswählen's ring and pillars.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { CapsuleShape, SphereShape } from '../destruction/shapes';
import { raycastVoxels } from '../voxel/raycast';
import { ReishiArrow } from './quincy';
import { groundAt } from './iceArts';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

/** Heilig Pfeil blue (dossier: #9FCFFF, core #F2FAFF) and the reiatsu blue */
export const PFEIL = '#9FCFFF';
export const REI_BLUE = '#4A78F0';
/** the Soul King's crimson reiatsu, the Black, the eyes */
export const CRIMSON = '#A80F1C';
const BLUE = new THREE.Color(PFEIL);
const SAND = new THREE.Color('#CFE6FF');
const VIOLET = new THREE.Color('#8C3CFF');

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _q = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);

function ground(g: Game, p: THREE.Vector3): number {
  return groundAt(g, p.x, p.y + 2, p.z, 10) ?? p.y;
}

/** two unit vectors spanning the plane facing `n` */
function basis(n: THREE.Vector3): [THREE.Vector3, THREE.Vector3] {
  const a = Math.abs(n.y) < 0.9 ? new THREE.Vector3().crossVectors(n, UP).normalize() : new THREE.Vector3(1, 0, 0);
  const b = new THREE.Vector3().crossVectors(a, n).normalize();
  return [a, b];
}

/** a burst shaped like the Quincy Zeichen: five rays of light round a flash, facing `n` */
export function zeichenBurst(g: Game, p: THREE.Vector3, n: THREE.Vector3, size = 1, color: THREE.Color = BLUE): void {
  const [a, b] = basis(n.clone().normalize());
  for (let k = 0; k < 5; k++) {
    const ang = (k / 5) * Math.PI * 2 + Math.PI / 2;
    const d = a.clone().multiplyScalar(Math.cos(ang)).addScaledVector(b, Math.sin(ang));
    for (let i = 0; i < 4; i++) {
      const s = (6 + i * 4) * size;
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: d.x * s, vy: d.y * s, vz: d.z * s, size: 0.28 * size, sizeEnd: 0.04, life: 0.28, r: color.r, g: color.g, b: color.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3.4, drag: 4 });
    }
  }
  g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 1.4 * size, sizeEnd: 2.6 * size, life: 0.22, r: 0.85, g: 0.95, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
}

/** grains of blue-white sand where he stood: he saw it coming */
export function sandBurst(g: Game, p: THREE.Vector3, n = 40): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 0.6;
    g.engine.glow.spawn({ x: p.x + Math.cos(a) * r, y: p.y + Math.random() * 1.9, z: p.z + Math.sin(a) * r, vx: Math.cos(a) * (1 + Math.random() * 3), vy: (Math.random() - 0.3) * 1.5, vz: Math.sin(a) * (1 + Math.random() * 3), size: 0.06, sizeEnd: 0.02, life: 0.6 + Math.random() * 0.6, r: SAND.r, g: SAND.g, b: SAND.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 1.5, gravity: -2 });
  }
}

// ------------------------------------------------------------------ bows of light

let bowGeo: THREE.BufferGeometry | null = null;
/** an arc of light and its string, 1 m across (scaled up), in the XY plane facing +Z, the string along X=0 */
function bowGeometry(): THREE.BufferGeometry {
  if (bowGeo) return bowGeo;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 24; i++) {
    const a = (-0.42 + (i / 24) * 0.84) * Math.PI;
    pts.push(new THREE.Vector3(-Math.cos(a) * 0.5 + 0.18, Math.sin(a) * 0.5, 0));
  }
  const arc = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.025, 5, false);
  const top = pts[pts.length - 1], bot = pts[0];
  const string = new THREE.CylinderGeometry(0.006, 0.006, top.distanceTo(bot), 4, 1, true);
  string.translate(top.x, 0, 0);
  const merged = new THREE.BufferGeometry();
  const pos: number[] = [];
  for (const gg of [arc.toNonIndexed(), string.toNonIndexed()]) pos.push(...(gg.attributes.position.array as Float32Array));
  merged.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  bowGeo = merged;
  return merged;
}

function bowMesh(scale: number, color: THREE.Color): THREE.Mesh {
  const m = new THREE.Mesh(bowGeometry(), new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(2.2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.scale.setScalar(scale);
  m.frustumCulled = false;
  m.renderOrder = 6;
  return m;
}

/** orient a bow at `p` to shoot toward `to` (its local +X points at the target) */
function aimBow(m: THREE.Mesh, p: THREE.Vector3, to: THREE.Vector3): void {
  m.position.copy(p);
  const d = _v.subVectors(to, p).normalize();
  _q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), d);
  m.quaternion.copy(_q);
}

/**
 * Sankt Bogen: a great bow of light forms in the air near the target (above and behind him), draws, and looses
 * one giant arrow that blows a crater where it lands; then fades.
 */
export class SanktBogen implements Projectile {
  done = false;
  private t = 0;
  private fired = false;
  private bow: THREE.Mesh;
  readonly at: THREE.Vector3;

  constructor(private g: Game, readonly owner: Fighter, private target: () => THREE.Vector3, readonly scale = 1) {
    const tp = target();
    const from = owner.center();
    // up in the sky behind and to one side of him, looking down on the target
    const back = _v.subVectors(from, tp).setY(0).normalize();
    const side = new THREE.Vector3(-back.z, 0, back.x);
    this.at = tp.clone().addScaledVector(back, 10 + Math.random() * 4).addScaledVector(side, (Math.random() - 0.5) * 8);
    this.at.y = Math.max(tp.y, from.y) + 11 + Math.random() * 3;
    this.bow = bowMesh(9 * scale, BLUE);
    aimBow(this.bow, this.at, tp);
    g.engine.gr.scene.add(this.bow);
    g.sfx.play('charge', this.at, 0.8);
  }

  update(dt: number): void {
    const g = this.g;
    this.t += dt;
    const tp = this.target();
    if (!this.fired) aimBow(this.bow, this.at, tp);
    if (!this.fired && this.t >= 0.45) {
      this.fired = true;
      const d = tp.clone().sub(this.at).normalize();
      g.addProjectile(new ReishiArrow(this.owner, g, this.at.clone().addScaledVector(d, 1.5), d, { damage: 70 * this.scale, speed: 95, burst: 2.6 * this.scale, size: 7 * this.scale, range: 90, color: PFEIL }));
      zeichenBurst(g, this.at, d, 1.4 * this.scale);
      g.sfx.play('arrow', this.at, 1.2);
    }
    // a few glints running along the bow while it stands
    if (Math.random() < 0.6) g.engine.glow.spawn({ x: this.at.x + (Math.random() - 0.5) * 3, y: this.at.y + (Math.random() - 0.5) * 6, z: this.at.z + (Math.random() - 0.5) * 3, size: 0.25, sizeEnd: 0.04, life: 0.3, r: BLUE.r, g: BLUE.g, b: BLUE.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    if (this.t > 1.3) this.done = true;
  }

  render(): void {
    const k = this.t < 0.3 ? this.t / 0.3 : this.t > 0.9 ? Math.max(0, 1 - (this.t - 0.9) / 0.4) : 1;
    (this.bow.material as THREE.MeshBasicMaterial).opacity = k * 0.95;
    // the string drawn back, then released
    const draw = this.fired ? 1 : 1 - Math.min(1, this.t / 0.45) * 0.12;
    this.bow.scale.set(9 * this.scale * draw, 9 * this.scale, 9 * this.scale);
  }

  dispose(): void {
    this.bow.removeFromParent();
    (this.bow.material as THREE.Material).dispose();
  }
}

/**
 * Qual Kreis: reishi crackles like lightning round the target, then hardens into a ring of bows standing
 * round it, and they fire inward from every side.
 */
export class QualKreis implements Projectile {
  done = false;
  private t = 0;
  private bows: { m: THREE.Mesh; p: THREE.Vector3; fired: boolean }[] = [];
  private centre: THREE.Vector3;

  constructor(private g: Game, readonly owner: Fighter, private victim: Fighter | null, at: THREE.Vector3, readonly scale = 1) {
    this.centre = at.clone();
  }

  private get aim(): THREE.Vector3 {
    if (this.victim && !this.victim.dead && this.t < 0.95) this.centre.lerp(this.victim.center(_w), 0.2);
    return this.centre;
  }

  /** the bows form */
  formBows(): void {
    const n = Math.round(7 * this.scale);
    const R = 7.5 * this.scale;
    const c = this.aim;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.3;
      const p = new THREE.Vector3(c.x + Math.cos(a) * R, c.y + 1.2 + (i % 2) * 1.6, c.z + Math.sin(a) * R);
      const m = bowMesh(3.2 * this.scale, BLUE);
      aimBow(m, p, c);
      this.g.engine.gr.scene.add(m);
      this.bows.push({ m, p, fired: false });
      zeichenBurst(this.g, p, _v.subVectors(c, p).normalize(), 0.5);
    }
    this.g.sfx.play('charge', c, 1);
  }

  update(dt: number): void {
    const g = this.g;
    this.t += dt;
    const c = this.aim;
    // the crackle: arcs of light jumping round the target
    if (this.t < 1.1) {
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.3) * 1.6, r = 1.2 + Math.random() * 1.6;
        const p = _v.set(c.x + Math.cos(a) * r, c.y + e, c.z + Math.sin(a) * r);
        g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: -Math.sin(a) * 9, vy: (Math.random() - 0.5) * 6, vz: Math.cos(a) * 9, size: 0.12, sizeEnd: 0.03, life: 0.1, r: 0.75, g: 0.9, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 4 });
      }
      if (this.victim && !this.victim.dead && c.distanceTo(this.victim.center(_w)) < 3) this.victim.slow(0.5, 0.3);
    }
    if (this.bows.length === 0 && this.t >= 0.4) this.formBows();
    // fire one after another, inward
    this.bows.forEach((b, i) => {
      aimBow(b.m, b.p, c);
      if (!b.fired && this.t >= 0.8 + i * 0.06) {
        b.fired = true;
        const d = c.clone().sub(b.p).normalize();
        g.addProjectile(new ReishiArrow(this.owner, g, b.p.clone().addScaledVector(d, 0.8), d, { damage: 16 * this.scale, speed: 80, burst: 1.3, size: 3.2 * this.scale, range: 20 * this.scale, color: PFEIL, quiet: i % 2 === 1 }));
        g.sfx.play('arrow', b.p, 0.6);
      }
    });
    if (this.t > 1.9) this.done = true;
  }

  render(): void {
    for (const b of this.bows) {
      const k = b.fired ? Math.max(0, 1 - (this.t - 0.85) / 0.9) : Math.min(1, (this.t - 0.4) / 0.2);
      (b.m.material as THREE.MeshBasicMaterial).opacity = Math.max(0, k) * 0.9;
    }
  }

  dispose(): void {
    for (const b of this.bows) {
      b.m.removeFromParent();
      (b.m.material as THREE.Material).dispose();
    }
  }
}

// ------------------------------------------------------------------ Blut Vene Anhaben

const SHELL_VS = /* glsl */ `
  varying vec3 vN; varying vec3 vW; varying vec3 vL;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vW = wp.xyz; vL = position;
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;
const SHELL_FS = /* glsl */ `
  uniform vec3 uCol; uniform float uA; uniform float uTime;
  varying vec3 vN; varying vec3 vW; varying vec3 vL;
  float h(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float n3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h(i), h(i + vec3(1,0,0)), f.x), mix(h(i + vec3(0,1,0)), h(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(h(i + vec3(0,0,1)), h(i + vec3(1,0,1)), f.x), mix(h(i + vec3(0,1,1)), h(i + vec3(1,1,1)), f.x), f.y), f.z); }
  void main() {
    vec3 v = normalize(cameraPosition - vW);
    float f = 1.0 - abs(dot(normalize(vN), v));
    // branching veins: the ridges of a warped noise field
    vec3 p = vL * 3.2 + vec3(0.0, uTime * 0.25, 0.0);
    float n = n3(p + n3(p * 1.7) * 1.4);
    float vein = 1.0 - smoothstep(0.0, 0.06, abs(n - 0.5));
    float a = uA * (0.08 + 0.35 * f * f + vein * 0.75);
    gl_FragColor = vec4(uCol * (1.2 + vein * 1.6), a);
  }`;

/**
 * Blut Vene Anhaben: Blut Vene thrown out from the hand into a sphere round him. Shots that touch it are
 * undone; whoever touches it (or stands inside) is drained through blue veins — the reiatsu flows into him.
 */
export class BlutAnhaben implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  private tick = 0;

  constructor(private g: Game, readonly owner: Fighter, readonly radius: number, readonly life: number, readonly drain: number) {
    this.mat = new THREE.ShaderMaterial({ uniforms: { uCol: { value: new THREE.Color('#4C9BFF') }, uA: { value: 0 }, uTime: { value: 0 } }, vertexShader: SHELL_VS, fragmentShader: SHELL_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
    g.engine.gr.scene.add(this.mesh);
    g.sfx.play('charge', owner.center(), 0.9);
  }

  get centre(): THREE.Vector3 {
    return this.owner.center(_w);
  }

  update(dt: number): void {
    const g = this.g, f = this.owner;
    this.t += dt;
    if (this.t >= this.life || f.dead) {
      this.done = true;
      return;
    }
    const c = this.centre.clone();
    const R = this.radius * Math.min(1, this.t / 0.25);
    // shots that reach the shell are undone
    g.rejectNear(c, R, f, false);
    this.tick -= dt;
    if (this.tick > 0) return;
    this.tick = 0.2;
    for (const o of g.enemiesOf(f)) {
      if (o.dead) continue;
      const d = o.center(_v).distanceTo(c);
      if (d > R + o.def.radius) continue;
      // the veins crawl over them; what they lose, he gains
      g.drain(o, this.drain * 0.2, f);
      o.rei = Math.max(0, o.rei - this.drain * 0.15);
      o.slow(0.4, 0.4);
      f.hp = Math.min(f.maxHp, f.hp + this.drain * 0.2 * 0.6);
      const p = o.center(_v);
      for (let i = 0; i < 5; i++) {
        const a = Math.random() * Math.PI * 2, y = (Math.random() - 0.5) * o.def.height * 0.8;
        g.engine.glow.spawn({ x: p.x + Math.cos(a) * o.def.radius, y: p.y + y, z: p.z + Math.sin(a) * o.def.radius, vx: (c.x - p.x) * 1.5, vy: (c.y - p.y - y) * 1.5, vz: (c.z - p.z) * 1.5, size: 0.08, sizeEnd: 0.02, life: 0.5, r: 0.3, g: 0.6, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
      }
    }
  }

  render(_dt: number, time: number): void {
    const R = this.radius * Math.min(1, this.t / 0.25);
    this.mesh.position.copy(this.centre);
    this.mesh.scale.setScalar(Math.max(0.01, R));
    const fade = Math.min(1, (this.life - this.t) / 0.4);
    this.mat.uniforms.uA.value = Math.min(1, this.t / 0.2) * fade;
    this.mat.uniforms.uTime.value = time;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}

// ------------------------------------------------------------------ the shadow blades

let spikeGeo: THREE.BufferGeometry | null = null;

/**
 * Black blades bursting up from the ground (Traps of Fate: where the target will be; the Soul King's forests of
 * spikes). Each point erupts after its delay, holds and sinks; whoever stands on it is run through and held.
 */
export class ShadowSpikes implements Projectile {
  done = false;
  private t = 0;
  private spikes: { p: THREE.Vector3; delay: number; h: number; m: THREE.Mesh; hit: boolean; tilt: THREE.Quaternion }[] = [];
  private mat: THREE.MeshBasicMaterial;

  constructor(private g: Game, readonly owner: Fighter, points: { p: THREE.Vector3; delay: number; h?: number }[], readonly damage: number, readonly hold = 0.6) {
    if (!spikeGeo) {
      const c = new THREE.ConeGeometry(0.22, 1, 4, 1);
      c.translate(0, 0.5, 0);
      spikeGeo = c;
    }
    this.mat = new THREE.MeshBasicMaterial({ color: '#0C0B10' });
    for (const pt of points) {
      const p = pt.p.clone();
      p.y = ground(g, p);
      // a cluster: one tall blade and a few smaller ones leaning out
      for (let i = 0; i < 4; i++) {
        const off = i === 0 ? new THREE.Vector3() : new THREE.Vector3((Math.random() - 0.5) * 1.1, 0, (Math.random() - 0.5) * 1.1);
        const m = new THREE.Mesh(spikeGeo, this.mat);
        m.frustumCulled = false;
        const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(), i === 0 ? 0.05 : 0.25 + Math.random() * 0.3);
        m.visible = false;
        g.engine.gr.scene.add(m);
        this.spikes.push({ p: p.clone().add(off), delay: pt.delay + i * 0.03, h: (pt.h ?? 2.6) * (i === 0 ? 1 : 0.5 + Math.random() * 0.3), m, hit: i !== 0, tilt });
      }
    }
  }

  update(dt: number): void {
    const g = this.g;
    this.t += dt;
    let alive = false;
    for (const s of this.spikes) {
      const u = this.t - s.delay;
      if (u < this.hold + 0.6) alive = true;
      if (u < 0 || s.hit) continue;
      s.hit = true;
      // the blade bursts up: whoever stands on it is run through and held
      for (const o of g.enemiesOf(this.owner)) {
        if (o.dead) continue;
        if (Math.hypot(o.pos.x - s.p.x, o.pos.z - s.p.z) > o.def.radius + 0.75 || Math.abs(o.pos.y - s.p.y) > 1.6) continue;
        g.damage(o, this.damage, this.owner, UP.clone(), { knock: 2, launch: 5, heavy: true, hitstop: 0.08, shake: 0.3 });
        o.hitstun = Math.max(o.hitstun, 0.7);
        o.slow(0.7, 0.9);
      }
      g.engine.destruction.carve(new SphereShape(s.p.clone(), 0.6, 0.5), { mode: 'smash', power: 300, impulse: 5, dust: 0.6 });
      for (let i = 0; i < 6; i++) g.engine.dust.spawn({ x: s.p.x, y: s.p.y + 0.1, z: s.p.z, vx: (Math.random() - 0.5) * 5, vy: 1 + Math.random() * 2, vz: (Math.random() - 0.5) * 5, size: 0.5, sizeEnd: 1.4, life: 0.6, r: 0.06, g: 0.05, b: 0.08, alpha: 0.7, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
      g.sfx.play('impact', s.p, 0.6);
    }
    if (!alive) this.done = true;
  }

  render(): void {
    for (const s of this.spikes) {
      const u = this.t - s.delay;
      if (u < 0) { s.m.visible = false; continue; }
      const k = u < 0.1 ? u / 0.1 : u < this.hold ? 1 : Math.max(0, 1 - (u - this.hold) / 0.5);
      s.m.visible = k > 0.01;
      s.m.position.copy(s.p);
      s.m.quaternion.copy(s.tilt);
      s.m.scale.set(1 + s.h * 0.25, Math.max(0.01, s.h * k), 1 + s.h * 0.25);
    }
  }

  dispose(): void {
    for (const s of this.spikes) s.m.removeFromParent();
    this.mat.dispose();
  }
}

/** A wound that blooms on its target a little after the stroke that "missed" it: it ignores guard and distance. */
export class FutureWound implements Projectile {
  done = false;
  private t = 0;
  constructor(private g: Game, readonly owner: Fighter, readonly victim: Fighter, readonly damage: number, readonly delay = 0.65) {}

  update(dt: number): void {
    const g = this.g, o = this.victim;
    this.t += dt;
    if (o.dead) {
      this.done = true;
      return;
    }
    const c = o.center(_v);
    // the line of the cut drawing itself on them, red, before it opens
    if (this.t < this.delay) {
      const k = this.t / this.delay;
      for (let i = 0; i < 3; i++) {
        const u = (Math.random() - 0.5) * 1.2 * k;
        g.engine.glow.spawn({ x: c.x + u * Math.cos(o.yaw), y: c.y + u * 0.6, z: c.z - u * Math.sin(o.yaw), size: 0.08, sizeEnd: 0.02, life: 0.12, r: 1, g: 0.2, b: 0.25, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
      }
      return;
    }
    // it already happened
    this.done = true;
    const dir = _w.subVectors(o.pos, this.owner.pos).setY(0).normalize().clone();
    o.invuln = 0;
    g.damage(o, this.damage, this.owner, dir, { knock: 6, launch: 2, heavy: true, hitstop: 0.14, shake: 0.4, color: '#E0303C' });
    for (let i = 0; i < 24; i++) {
      const u = (Math.random() - 0.5) * 1.6;
      g.engine.glow.spawn({ x: c.x + u * Math.cos(o.yaw), y: c.y + u * 0.6, z: c.z - u * Math.sin(o.yaw), vx: (Math.random() - 0.5) * 4, vy: Math.random() * 3, vz: (Math.random() - 0.5) * 4, size: 0.12, sizeEnd: 0.03, life: 0.45, r: 0.85, g: 0.08, b: 0.12, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2, gravity: -6 });
    }
    sandBurst(g, c, 16);
  }

  dispose(): void {}
}

// ------------------------------------------------------------------ the Soul King

let eyeGeo: THREE.SphereGeometry | null = null;
let pupilGeo: THREE.SphereGeometry | null = null;

/** an eye opening in the air: a bone-white ball with a red pupil, turning to look at `at` */
function eyeMesh(): THREE.Group {
  if (!eyeGeo) eyeGeo = new THREE.SphereGeometry(0.2, 12, 8);
  if (!pupilGeo) pupilGeo = new THREE.SphereGeometry(0.09, 8, 6);
  const gr = new THREE.Group();
  const w = new THREE.Mesh(eyeGeo, new THREE.MeshBasicMaterial({ color: '#D9D2C4' }));
  const p = new THREE.Mesh(pupilGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color('#C8141F').multiplyScalar(1.8) }));
  p.position.z = 0.15;
  gr.add(w, p);
  gr.traverse((c) => (c.frustumCulled = false));
  return gr;
}

/**
 * The eyes open all over the Black round him and fire: crimson beams from every eye at the target, a barrage
 * that bends toward it. Each beam bores a little hole where it ends.
 */
export class EyeBeams implements Projectile {
  done = false;
  private t = 0;
  private eyes: { g: THREE.Group; off: THREE.Vector3; next: number; shots: number }[] = [];

  constructor(private g: Game, readonly owner: Fighter, private target: () => THREE.Vector3, readonly count = 14, readonly dmg = 7) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.2) * 1.4;
      const r = 1.2 + Math.random() * 1.4;
      const gr = eyeMesh();
      gr.scale.setScalar(0.01);
      g.engine.gr.scene.add(gr);
      this.eyes.push({ g: gr, off: new THREE.Vector3(Math.cos(a) * r, 1.0 + e + Math.random(), Math.sin(a) * r * 0.6 - 0.6), next: 0.35 + Math.random() * 0.3, shots: 0 });
    }
  }

  private eyePos(e: { off: THREE.Vector3 }, out: THREE.Vector3): THREE.Vector3 {
    const f = this.owner;
    const c = Math.cos(f.yaw), s = Math.sin(f.yaw);
    return out.set(f.pos.x + e.off.x * c + e.off.z * s, f.pos.y + e.off.y, f.pos.z - e.off.x * s + e.off.z * c);
  }

  update(dt: number): void {
    const g = this.g;
    this.t += dt;
    const tp = this.target();
    for (const e of this.eyes) {
      if (this.t < e.next || this.t > 1.5 || e.shots >= 2) continue;
      e.shots++;
      e.next = this.t + 0.3 + Math.random() * 0.3;
      // a beam: straight at the target with a little spread, stopped by walls
      const from = this.eyePos(e, new THREE.Vector3());
      const to = tp.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8));
      const dir = to.clone().sub(from);
      const len = Math.min(60, dir.length() + 4);
      dir.normalize();
      const hit = raycastVoxels(g.engine.world, from.x, from.y, from.z, dir.x, dir.y, dir.z, len);
      const end = from.clone().addScaledVector(dir, hit ? hit.dist : len);
      for (const o of g.enemiesOf(this.owner)) {
        if (o.dead) continue;
        const cc = o.center(_v);
        const along = Math.max(0, Math.min(hit ? hit.dist : len, _w.subVectors(cc, from).dot(dir)));
        const p = from.clone().addScaledVector(dir, along);
        if (p.distanceTo(cc) > o.def.radius + 0.35) continue;
        g.damage(o, this.dmg, this.owner, dir.clone().setY(0).normalize(), { knock: 1.5, energy: true, quiet: true, color: '#E01A2B' });
      }
      if (hit) g.engine.destruction.carve(new SphereShape(end.clone(), 0.35, 0.5), { mode: 'bore', power: 240 });
      const n = Math.ceil(from.distanceTo(end) / 0.9);
      for (let i = 0; i < n; i++) {
        const p = from.clone().lerp(end, i / n);
        g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: dir.x * 6, vy: dir.y * 6, vz: dir.z * 6, size: 0.14, sizeEnd: 0.04, life: 0.12, r: 0.9, g: 0.1, b: 0.15, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 4 });
      }
      g.engine.glow.spawn({ x: end.x, y: end.y, z: end.z, size: 0.6, sizeEnd: 0.1, life: 0.15, r: 1, g: 0.2, b: 0.25, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    }
    if (this.t > 1.9) this.done = true;
  }

  render(): void {
    const tp = this.target();
    for (const e of this.eyes) {
      const k = this.t < 0.3 ? this.t / 0.3 : this.t > 1.55 ? Math.max(0, 1 - (this.t - 1.55) / 0.3) : 1;
      e.g.scale.setScalar(Math.max(0.01, k * (1 + Math.sin(this.t * 9 + e.off.x) * 0.1)));
      this.eyePos(e, e.g.position);
      e.g.lookAt(tp);
    }
  }

  dispose(): void {
    for (const e of this.eyes) e.g.removeFromParent();
  }
}

/**
 * The Zeichen energy blast: five pillars of the Black, eyes on them, rise before him in a star; the star's
 * centre opens into one great eye that gathers, then a violet beam erases everything ahead (a CeroBeam fired
 * from the eye, see the kit).
 */
export class ZeichenEmblem implements Projectile {
  done = false;
  private t = 0;
  readonly eye = new THREE.Object3D();
  private pillars: THREE.Mesh[] = [];
  private mat: THREE.MeshBasicMaterial;
  private eyeG: THREE.Group;

  constructor(private g: Game, readonly owner: Fighter, readonly life = 2.6) {
    this.mat = new THREE.MeshBasicMaterial({ color: '#0C0B10' });
    const geo = new THREE.CylinderGeometry(0.28, 0.4, 1, 6);
    geo.translate(0, 0.5, 0);
    for (let i = 0; i < 5; i++) {
      const m = new THREE.Mesh(geo, this.mat);
      m.frustumCulled = false;
      g.engine.gr.scene.add(m);
      this.pillars.push(m);
    }
    this.eyeG = eyeMesh();
    g.engine.gr.scene.add(this.eyeG, this.eye);
  }

  /** where the star stands: before him, facing where he faces */
  private frame(): { c: THREE.Vector3; fw: THREE.Vector3; side: THREE.Vector3 } {
    const f = this.owner;
    const fw = new THREE.Vector3(Math.sin(f.yaw), 0, Math.cos(f.yaw));
    const side = new THREE.Vector3(fw.z, 0, -fw.x);
    const c = f.pos.clone().addScaledVector(fw, 3.2);
    c.y += 2.6;
    return { c, fw, side };
  }

  update(dt: number): void {
    const g = this.g;
    this.t += dt;
    const { c, fw, side } = this.frame();
    this.eye.position.copy(c).addScaledVector(fw, 0.3);
    const k = Math.min(1, this.t / 0.6);
    // the star traced in violet light between the pillar tips
    if (this.t < this.life - 0.3 && Math.random() < 0.9) {
      const a0 = Math.floor(Math.random() * 5);
      const pa = this.star(c, side, a0, 2.3 * k), pb = this.star(c, side, (a0 + 2) % 5, 2.3 * k);
      const u = Math.random();
      const p = pa.lerp(pb, u);
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.18, sizeEnd: 0.05, life: 0.2, r: VIOLET.r, g: VIOLET.g, b: VIOLET.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    }
    // the central eye gathering: motes drawn in
    if (this.t > 0.6 && this.t < 1.5) {
      for (let i = 0; i < 3; i++) {
        const d = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        g.engine.glow.spawn({ x: c.x + d.x * 3, y: c.y + d.y * 3, z: c.z + d.z * 3, vx: -d.x * 9, vy: -d.y * 9, vz: -d.z * 9, size: 0.14, sizeEnd: 0.04, life: 0.3, r: 0.75, g: 0.5, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
      }
    }
    if (this.t > this.life) this.done = true;
  }

  private star(c: THREE.Vector3, side: THREE.Vector3, i: number, r: number): THREE.Vector3 {
    const a = (i / 5) * Math.PI * 2 + Math.PI / 2;
    return c.clone().addScaledVector(side, Math.cos(a) * r).add(new THREE.Vector3(0, Math.sin(a) * r, 0));
  }

  render(): void {
    const { c, fw, side } = this.frame();
    const k = Math.min(1, this.t / 0.6) * (this.t > this.life - 0.4 ? Math.max(0, (this.life - this.t) / 0.4) : 1);
    this.pillars.forEach((m, i) => {
      // each pillar stands from the ground up to its point of the star
      const top = this.star(c, side, i, 2.3);
      const base = top.clone();
      base.y = this.owner.pos.y;
      m.position.copy(base).addScaledVector(fw, 0.05 * i);
      m.scale.set(1, Math.max(0.01, (top.y - base.y + 0.6) * k), 1);
    });
    this.eyeG.position.copy(c);
    this.eyeG.scale.setScalar(Math.max(0.01, k * (2.6 + Math.min(1, Math.max(0, this.t - 0.6)) * 1.4)));
    this.eyeG.lookAt(c.clone().addScaledVector(fw, 10));
  }

  dispose(): void {
    for (const m of this.pillars) m.removeFromParent();
    this.pillars[0]?.geometry.dispose();
    this.mat.dispose();
    this.eyeG.removeFromParent();
    this.eye.removeFromParent();
  }
}

/**
 * The Torrent of the Soul King's power: a swarm of small black one-eyed creatures with fangs pours out of the
 * Black and runs down the target — biting while they cling — until they are spent.
 */
export class EyeSwarm implements Projectile {
  done = false;
  private t = 0;
  private bits: { g: THREE.Group; p: THREE.Vector3; v: THREE.Vector3; ph: number; bite: number; bites: number }[] = [];
  private bodyGeo = new THREE.SphereGeometry(0.22, 8, 6);
  private bodyMat = new THREE.MeshBasicMaterial({ color: '#0A090D' });

  constructor(private g: Game, readonly owner: Fighter, private victim: Fighter | null, readonly count = 26, readonly life = 6, readonly bite = 5) {
    const c = owner.center();
    for (let i = 0; i < count; i++) {
      const gr = new THREE.Group();
      const body = new THREE.Mesh(this.bodyGeo, this.bodyMat);
      body.scale.set(1, 0.85, 1.1);
      const eye = eyeMesh();
      eye.scale.setScalar(0.8);
      eye.position.set(0, 0.06, 0.12);
      gr.add(body, eye);
      gr.traverse((o) => (o.frustumCulled = false));
      g.engine.gr.scene.add(gr);
      const a = Math.random() * Math.PI * 2;
      this.bits.push({ g: gr, p: c.clone().add(new THREE.Vector3(Math.cos(a) * 0.8, (Math.random() - 0.5) * 1.2, Math.sin(a) * 0.8)), v: new THREE.Vector3(Math.cos(a) * 6, 3 + Math.random() * 3, Math.sin(a) * 6), ph: Math.random() * 6, bite: 0, bites: 0 });
    }
  }

  update(dt: number): void {
    const g = this.g;
    this.t += dt;
    if (!this.victim || this.victim.dead) {
      let best: Fighter | null = null, bd = 50;
      for (const o of g.enemiesOf(this.owner)) {
        const d = o.pos.distanceTo(this.owner.pos);
        if (!o.dead && d < bd) { bd = d; best = o; }
      }
      this.victim = best;
    }
    const tgt = this.victim;
    for (const b of this.bits) {
      // spent after two bites: it drops away and melts back into the Black
      if (tgt && b.bites < 2) {
        const c = tgt.center(_v);
        c.y += Math.sin(b.ph + this.t * 3) * 0.6;
        const d = _w.subVectors(c, b.p);
        const dist = d.length();
        d.normalize();
        b.v.addScaledVector(d, dt * 26).multiplyScalar(Math.exp(-dt * 1.6));
        if (dist < tgt.def.radius + 0.4) {
          b.bite -= dt;
          if (b.bite <= 0) {
            b.bite = 0.45;
            b.bites++;
            g.damage(tgt, this.bite, this.owner, d.clone().setY(0).normalize(), { knock: 0.5, quiet: true });
            tgt.slow(0.3, 0.5);
          }
        }
      }
      b.v.y -= dt * 4;
      b.p.addScaledVector(b.v, dt);
      const gy = ground(g, b.p);
      if (b.p.y < gy + 0.2) {
        b.p.y = gy + 0.2;
        b.v.y = Math.abs(b.v.y) * 0.3 + 2.5;
      }
    }
    if (this.t > this.life) this.done = true;
  }

  render(): void {
    const k = this.t > this.life - 0.5 ? Math.max(0, (this.life - this.t) / 0.5) : Math.min(1, this.t / 0.2);
    for (const b of this.bits) {
      b.g.position.copy(b.p);
      b.g.scale.setScalar(Math.max(0.01, b.bites >= 2 ? k * 0.5 : k));
      if (b.v.lengthSq() > 0.01) b.g.quaternion.setFromUnitVectors(Z, _v.copy(b.v).normalize());
    }
  }

  dispose(): void {
    for (const b of this.bits) b.g.removeFromParent();
    this.bodyGeo.dispose();
    this.bodyMat.dispose();
  }
}

/**
 * Auswählen: the holy selection. A ring of light (black, after the Soul King) opens in the sky over him, and a
 * pillar comes down on each of those he chooses: their power drains away up the pillar and into him.
 */
export class Auswahlen implements Projectile {
  done = false;
  private t = 0;
  private ring: THREE.Mesh;
  private pillars: { m: THREE.Mesh; o: Fighter }[] = [];
  private drained = 0;

  constructor(private g: Game, readonly owner: Fighter, victims: Fighter[], readonly black: boolean, readonly dps: number, readonly onDrain: (amount: number) => void) {
    const col = black ? new THREE.Color('#0A0A0F') : new THREE.Color('#F4F9FF').multiplyScalar(1.6);
    this.ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 6, 64), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, blending: black ? THREE.NormalBlending : THREE.AdditiveBlending, depthWrite: false }));
    this.ring.rotation.x = Math.PI / 2;
    this.ring.frustumCulled = false;
    g.engine.gr.scene.add(this.ring);
    const pg = new THREE.CylinderGeometry(0.7, 0.9, 1, 12, 1, true);
    pg.translate(0, 0.5, 0);
    for (const o of victims) {
      const m = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ color: new THREE.Color(black ? '#9CC4FF' : '#F4F9FF').multiplyScalar(1.4), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      m.frustumCulled = false;
      g.engine.gr.scene.add(m);
      this.pillars.push({ m, o });
    }
    g.sfx.play('purify', owner.center(), 1);
  }

  update(dt: number): void {
    const g = this.g;
    this.t += dt;
    if (this.t > 0.7 && this.t < 2.4) {
      for (const p of this.pillars) {
        const o = p.o;
        if (o.dead) continue;
        // the power drawn out of them, up the pillar
        g.drain(o, this.dps * dt, this.owner);
        o.rei = Math.max(0, o.rei - this.dps * 0.8 * dt);
        o.sealT = Math.max(o.sealT, 4);
        o.sealK = Math.max(o.sealK, 0.3);
        o.slow(0.6, 0.3);
        this.drained += this.dps * dt;
        const c = o.center(_v);
        if (Math.random() < 0.7) g.engine.glow.spawn({ x: c.x + (Math.random() - 0.5) * 0.8, y: c.y + (Math.random() - 0.5) * 1.4, z: c.z + (Math.random() - 0.5) * 0.8, vy: 9, size: 0.12, sizeEnd: 0.03, life: 0.6, r: 0.85, g: 0.93, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
      }
    }
    if (this.t >= 2.4 && this.drained > 0) {
      this.onDrain(this.drained);
      this.drained = 0;
    }
    if (this.t > 2.9) this.done = true;
  }

  render(): void {
    const f = this.owner;
    const k = Math.min(1, this.t / 0.6);
    const fade = this.t > 2.4 ? Math.max(0, 1 - (this.t - 2.4) / 0.5) : 1;
    this.ring.position.set(f.pos.x, f.pos.y + 16, f.pos.z);
    this.ring.scale.setScalar(4 + k * 26);
    (this.ring.material as THREE.MeshBasicMaterial).opacity = k * fade * 0.95;
    for (const p of this.pillars) {
      const top = f.pos.y + 16;
      p.m.position.set(p.o.pos.x, p.o.pos.y, p.o.pos.z);
      p.m.scale.set(1, Math.max(0.01, top - p.o.pos.y), 1);
      (p.m.material as THREE.MeshBasicMaterial).opacity = Math.max(0, Math.min(1, (this.t - 0.6) / 0.2)) * fade * 0.55;
    }
  }

  dispose(): void {
    this.ring.removeFromParent();
    this.ring.geometry.dispose();
    (this.ring.material as THREE.Material).dispose();
    for (const p of this.pillars) {
      p.m.removeFromParent();
      (p.m.material as THREE.Material).dispose();
    }
    this.pillars[0]?.m.geometry.dispose();
  }
}

/** The Black poured out over the ground in a wave toward the target: it batters and drags whoever it rolls over. */
export class BlackWave implements Projectile {
  done = false;
  private t = 0;
  private hit = new Set<number>();
  private p: THREE.Vector3;

  constructor(private g: Game, readonly owner: Fighter, readonly dir: THREE.Vector3, readonly damage: number, readonly range = 22, readonly width = 7) {
    this.p = owner.pos.clone().addScaledVector(dir, 1.5);
  }

  update(dt: number): void {
    const g = this.g;
    this.t += dt;
    const step = 20 * dt;
    this.p.addScaledVector(this.dir, step);
    this.p.y = ground(g, this.p);
    const side = new THREE.Vector3(-this.dir.z, 0, this.dir.x);
    for (let i = 0; i < 7; i++) {
      const u = (Math.random() - 0.5) * this.width;
      const q = this.p.clone().addScaledVector(side, u);
      g.engine.dust.spawn({ x: q.x, y: q.y + Math.random() * 1.8, z: q.z, vx: this.dir.x * 10, vy: 2 + Math.random() * 3, vz: this.dir.z * 10, size: 1.0, sizeEnd: 2.2, life: 0.55, r: 0.04, g: 0.035, b: 0.05, alpha: 0.85, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    }
    if (Math.random() < 0.5) g.engine.destruction.carve(new CapsuleShape(this.p.clone().addScaledVector(side, -this.width * 0.4), this.p.clone().addScaledVector(side, this.width * 0.4), 0.7), { mode: 'smash', power: 260, impulse: 6, dir: this.dir.clone(), dust: 0.3 });
    for (const o of g.enemiesOf(this.owner)) {
      if (o.dead || this.hit.has(o.id)) continue;
      const rel = _v.subVectors(o.pos, this.p);
      if (Math.abs(rel.dot(this.dir)) > 1.4 || Math.abs(rel.dot(side)) > this.width / 2 + o.def.radius || Math.abs(rel.y) > 3) continue;
      this.hit.add(o.id);
      g.damage(o, this.damage, this.owner, this.dir.clone(), { knock: 22, launch: 6, heavy: true, hitstop: 0.1, shake: 0.4 });
    }
    if (this.t * 20 > this.range) this.done = true;
  }

  dispose(): void {}
}
