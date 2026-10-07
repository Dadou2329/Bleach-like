// Hadō #99 Goryūtenmetsu, the Five Dragons of Destruction: the ground heaves up in slabs and five
// colossal serpents of light tear out of it, coil up into the sky and then dive on the target one after
// another. Each dragon is a chain of glowing segments trailing its head along the path it flew (an
// instanced mesh), with a horned head and a mane of sparks; each one detonates where it strikes.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { SphereShape } from '../destruction/shapes';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';

const SEGS = 34;
const HIST = 120;

interface Dragon {
  /** head path history (newest first) */
  hist: THREE.Vector3[];
  head: THREE.Vector3;
  vel: THREE.Vector3;
  rise: THREE.Vector3;
  t0: number;
  dive: number;
  struck: boolean;
  color: THREE.Color;
  phase: number;
}

export class DragonStrike implements Projectile {
  done = false;
  private t = 0;
  private dragons: Dragon[] = [];
  private mesh: THREE.InstancedMesh;
  private heads: THREE.Mesh[] = [];
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private s = new THREE.Vector3();
  private light: THREE.PointLight;

  constructor(private g: Game, private owner: Fighter, private target: () => THREE.Vector3, readonly damage = 90, readonly scale = 1) {
    const origin = owner.pos.clone();
    const cols = ['#E3D3FF', '#F3E38C', '#E3D3FF', '#F3E38C', '#D8C0FF'];
    for (let i = 0; i < 5; i++) {
      const a = owner.yaw + Math.PI + (i - 2) * 0.62;
      const p = origin.clone().add(new THREE.Vector3(Math.sin(a) * 4 * scale, -1.5, Math.cos(a) * 4 * scale));
      const rise = new THREE.Vector3(Math.sin(a) * 0.5, 1, Math.cos(a) * 0.5).normalize();
      this.dragons.push({ hist: Array.from({ length: HIST }, () => p.clone()), head: p.clone(), vel: rise.clone().multiplyScalar(18), rise, t0: i * 0.12, dive: 1.05 + i * 0.22, struck: false, color: new THREE.Color(cols[i]), phase: Math.random() * 6 });
    }
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
    this.mesh = new THREE.InstancedMesh(geo, mat, 5 * SEGS);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(5 * SEGS * 3), 3);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 7;
    g.engine.gr.scene.add(this.mesh);
    // horned heads
    const hg = new THREE.ConeGeometry(0.75 * scale, 2.2 * scale, 6);
    hg.rotateX(Math.PI / 2);
    for (const d of this.dragons) {
      const h = new THREE.Mesh(hg, new THREE.MeshBasicMaterial({ color: d.color.clone().multiplyScalar(1.6), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
      h.frustumCulled = false;
      h.renderOrder = 7;
      g.engine.gr.scene.add(h);
      this.heads.push(h);
    }
    this.light = new THREE.PointLight('#E3D3FF', 60, 40 * scale, 1.4);
    g.engine.gr.scene.add(this.light);
    // the ground heaves up where they will erupt
    for (const d of this.dragons) g.engine.destruction.carve(new SphereShape(new THREE.Vector3(d.head.x, origin.y, d.head.z), 1.6 * scale), { mode: 'explode', power: 300, impulse: 22 });
    g.sfx.play('roarBig', origin, 1.3);
    g.shake(0.8);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const tgt = this.target();
    let alive = 0;
    for (const d of this.dragons) {
      if (d.struck) continue;
      alive++;
      const lt = this.t - d.t0;
      if (lt < 0) continue;
      if (this.t < d.dive) {
        // coil upward around the caster
        const swirl = new THREE.Vector3(Math.cos(lt * 5 + d.phase), 0, Math.sin(lt * 5 + d.phase)).multiplyScalar(14 * this.scale);
        const want = d.rise.clone().multiplyScalar(22 * this.scale).add(swirl);
        d.vel.lerp(want, Math.min(1, dt * 3));
      } else {
        // dive on the target, hard
        const to = new THREE.Vector3().subVectors(tgt, d.head);
        const dist = to.length();
        to.normalize().multiplyScalar(46 * this.scale);
        d.vel.lerp(to, Math.min(1, dt * 6));
        if (dist < 1.6 * this.scale || (d.head.y < tgt.y - 0.5 && this.t > d.dive + 0.3)) this.strike(d, g);
      }
      d.head.addScaledVector(d.vel, dt);
      d.hist.unshift(d.head.clone());
      d.hist.length = HIST;
      if (Math.random() < 0.6) g.engine.glow.spawn({ x: d.head.x, y: d.head.y, z: d.head.z, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, vz: (Math.random() - 0.5) * 3, size: 0.5 * this.scale, sizeEnd: 0.05, life: 0.4, r: d.color.r, g: d.color.g, b: d.color.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2 });
      if (this.t > d.dive + 2.5) this.strike(d, g);
    }
    if (alive === 0 && this.t > 0.5) this.done = true;
  }

  private strike(d: Dragon, g: Game): void {
    d.struck = true;
    const p = d.head.clone();
    g.engine.destruction.carve(new SphereShape(p, 2.2 * this.scale, 0.8), { mode: 'explode', power: 520, impulse: 20 });
    g.addRing(p.clone(), 7 * this.scale, d.color, 0.6);
    for (const f of g.enemiesOf(this.owner)) {
      const dist = f.center().distanceTo(p);
      if (dist < 4 * this.scale) g.damage(f, this.damage * (0.5 + 0.5 * (1 - dist / (4 * this.scale))), this.owner, f.pos.clone().sub(p).setY(0.5).normalize(), { energy: true, knock: 18, launch: 8, heavy: true, hitstop: 0.08, shake: 0.6 });
    }
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 2, sizeEnd: 7 * this.scale, life: 0.4, r: d.color.r, g: d.color.g, b: d.color.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * 9, vy: Math.random() * 5, vz: Math.sin(a) * 9, size: 1.2, sizeEnd: 3.6, life: 1.2, r: 0.55, g: 0.52, b: 0.5, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 1.6 });
    }
    g.sfx.play('explode', p, 1.4);
    g.shake(0.5);
  }

  render(): void {
    const im = this.mesh.instanceMatrix.array as Float32Array;
    const ic = this.mesh.instanceColor!.array as Float32Array;
    let n = 0;
    let lx = 0, ly = 0, lz = 0, lc = 0;
    this.dragons.forEach((d, di) => {
      const head = this.heads[di];
      const lt = this.t - d.t0;
      const visible = lt > 0 && !d.struck;
      head.visible = visible;
      for (let i = 0; i < SEGS; i++) {
        const idx = di * SEGS + i;
        if (!visible) {
          this.m.makeScale(0, 0, 0);
          this.m.toArray(im, idx * 16);
          continue;
        }
        const p = d.hist[Math.min(HIST - 1, i * 3)];
        const k = 1 - i / SEGS;
        const r = (0.25 + 0.75 * Math.pow(k, 0.7)) * 0.8 * this.scale * (1 + Math.sin(this.t * 14 + i * 0.7) * 0.08);
        this.m.compose(p, this.q, this.s.set(r, r, r));
        this.m.toArray(im, idx * 16);
        const glow = 0.6 + k * 0.8;
        ic[idx * 3] = d.color.r * glow;
        ic[idx * 3 + 1] = d.color.g * glow;
        ic[idx * 3 + 2] = d.color.b * glow;
        n++;
      }
      if (visible) {
        head.position.copy(d.head);
        head.lookAt(d.head.clone().add(d.vel));
        lx += d.head.x; ly += d.head.y; lz += d.head.z; lc++;
      }
    });
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor!.needsUpdate = true;
    this.mesh.visible = n > 0;
    if (lc > 0) this.light.position.set(lx / lc, ly / lc, lz / lc);
    this.light.intensity = lc > 0 ? 60 : 0;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    for (const h of this.heads) {
      h.removeFromParent();
      (h.material as THREE.Material).dispose();
    }
    this.heads[0]?.geometry.dispose();
    this.light.removeFromParent();
  }
}
