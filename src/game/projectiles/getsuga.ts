// Getsuga Tenshō: a crescent of reiatsu released from the blade. It flies straight, cuts a crescent
// trench through anything it passes (structures slide apart along it), hits every enemy it crosses
// once and lights its surroundings.
import * as THREE from 'three';
import type { Game, Projectile } from '../game';
import type { Fighter } from '../fighter';
import { CrescentShape } from '../../destruction/shapes';
import { crescentGeometry, crescentMaterial, type EnergyColors } from '../../vfx/energy';
import { TEX_GLOW, TEX_STREAK } from '../../vfx/sprites';

export interface GetsugaOpts {
  radius: number;
  halfAngle: number;
  speed: number;
  range: number;
  damage: number;
  cut: number;
  colors: EnergyColors;
  dark?: boolean;
}

const _p = new THREE.Vector3();
const _m = new THREE.Matrix4();

export class GetsugaProjectile implements Projectile {
  done = false;
  private group = new THREE.Group();
  private mats: THREE.ShaderMaterial[] = [];
  private light: THREE.PointLight;
  readonly pos: THREE.Vector3;
  private travelled = 0;
  private hit = new Set<number>();
  private t = 0;
  private fade = 0;
  private normal: THREE.Vector3;
  private body: THREE.Color;
  private core: THREE.Color;

  constructor(private g: Game, private owner: Fighter, origin: THREE.Vector3, readonly dir: THREE.Vector3, readonly side: THREE.Vector3, readonly o: GetsugaOpts) {
    this.pos = origin.clone();
    this.dir.normalize();
    // make side orthogonal to dir
    this.side.addScaledVector(this.dir, -this.side.dot(this.dir)).normalize();
    this.normal = new THREE.Vector3().crossVectors(this.dir, this.side).normalize();
    const geo = crescentGeometry(o.radius, o.halfAngle, 0.35, o.radius * 0.42, 0.42);
    if (o.dark) {
      const dm = crescentMaterial(o.colors, true);
      const dmesh = new THREE.Mesh(geo, dm);
      dmesh.renderOrder = 5;
      dmesh.scale.setScalar(0.97);
      this.group.add(dmesh);
      this.mats.push(dm);
    }
    const m = crescentMaterial(o.colors);
    const mesh = new THREE.Mesh(geo, m);
    mesh.renderOrder = 6;
    this.group.add(mesh);
    this.mats.push(m);
    this.group.traverse((c) => (c.frustumCulled = false));
    this.body = new THREE.Color(o.colors.body);
    this.core = new THREE.Color(o.colors.core);
    this.light = new THREE.PointLight(this.body, 14, 16, 1.6);
    this.group.add(this.light);
    g.engine.gr.scene.add(this.group);
    this.place();
  }

  private place(): void {
    // arc centre is behind the leading edge
    const c = _p.copy(this.pos).addScaledVector(this.dir, -this.o.radius);
    this.group.position.copy(c);
    _m.makeBasis(this.side, this.normal, this.dir);
    this.group.quaternion.setFromRotationMatrix(_m);
    this.light.position.set(0, 0, this.o.radius * 0.9);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.fade > 0) {
      this.fade -= dt;
      if (this.fade <= 0) this.done = true;
      return;
    }
    const step = this.o.speed * dt;
    this.pos.addScaledVector(this.dir, step);
    this.travelled += step;
    this.place();
    // carve the crescent band where it is now
    const center = this.pos.clone().addScaledVector(this.dir, -this.o.radius);
    const shape = new CrescentShape(center, this.dir.clone(), this.side.clone(), this.o.radius, this.o.halfAngle, 0.38, 0.26);
    const r = g.engine.destruction.carve(shape, { mode: 'cut', power: this.o.cut, dir: this.dir.clone(), sparks: [this.body.r, this.body.g, this.body.b], dust: 0.8 });
    if (r.removed > 300 && g.player && this.pos.distanceTo(g.player.pos) < 40) g.shake(0.08);
    // hit fighters crossing the band
    for (const f of g.enemiesOf(this.owner)) {
      if (this.hit.has(f.id)) continue;
      const fc = f.center();
      _p.subVectors(fc, center);
      const pf = _p.dot(this.dir), ps = _p.dot(this.side), pn = _p.dot(this.normal);
      const ang = Math.atan2(ps, pf);
      if (Math.abs(ang) > this.o.halfAngle + 0.1) continue;
      if (Math.abs(Math.hypot(pf, ps) - this.o.radius) > 1.0 + f.def.radius) continue;
      if (Math.abs(pn) > 0.9 + f.def.radius) continue;
      this.hit.add(f.id);
      g.damage(f, this.o.damage, this.owner, this.dir, { knock: 14, launch: 4, heavy: true, hitstop: 0.1, shake: 0.4 });
      g.sparks(fc, this.dir, this.o.colors.body, 24);
    }
    // trailing motes from the arc + a soft core glow that reads from any angle
    const glow = g.engine.glow;
    const mid = _p.copy(center).addScaledVector(this.dir, this.o.radius * 0.85);
    glow.spawn({ x: mid.x, y: mid.y, z: mid.z, size: this.o.radius * 1.3, sizeEnd: this.o.radius * 0.6, life: 0.12, r: this.body.r, g: this.body.g, b: this.body.b, alpha: 0.55, alphaEnd: 0, tex: TEX_GLOW });
    for (let i = 0; i < 14; i++) {
      const a = (Math.random() * 2 - 1) * this.o.halfAngle;
      const rr = this.o.radius * (0.92 + Math.random() * 0.1);
      const px = center.x + (this.dir.x * Math.cos(a) + this.side.x * Math.sin(a)) * rr;
      const py = center.y + (this.dir.y * Math.cos(a) + this.side.y * Math.sin(a)) * rr;
      const pz = center.z + (this.dir.z * Math.cos(a) + this.side.z * Math.sin(a)) * rr;
      const c = Math.random() < 0.3 ? this.core : this.body;
      glow.spawn({ x: px, y: py, z: pz, vx: -this.dir.x * 6, vy: -this.dir.y * 6 + 1, vz: -this.dir.z * 6, size: 0.25 + Math.random() * 0.35, sizeEnd: 0.02, life: 0.3 + Math.random() * 0.3, r: c.r, g: c.g, b: c.b, alpha: 0.8, alphaEnd: 0, tex: Math.random() < 0.5 ? TEX_STREAK : TEX_GLOW, stretch: 2, drag: 2 });
    }
    if (this.travelled >= this.o.range) this.fade = 0.18;
  }

  render(_dt: number, time: number): void {
    const grow = Math.min(1, this.t / 0.08);
    const a = this.fade > 0 ? this.fade / 0.18 : 1;
    this.group.scale.set(0.6 + 0.4 * grow + (1 - a) * 0.3, 1, 0.6 + 0.4 * grow + (1 - a) * 0.3);
    for (const m of this.mats) {
      m.uniforms.uTime.value = time;
      m.uniforms.uA.value = a * grow;
    }
    this.light.intensity = 14 * a;
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const m of this.mats) m.dispose();
  }
}
