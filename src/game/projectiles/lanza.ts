// Luz de la Luna thrown: a javelin of green light that pierces whatever stands in its way, boring a
// tunnel straight through buildings. Lanza del Relámpago: the flame-ended version — its path wobbles
// (canon: hard to control) and on the first thing it touches it detonates in an explosion that dwarfs
// the town: a swelling dome of green-white light, a crater, a ring of dust racing outward.
import * as THREE from 'three';
import type { Game, Projectile } from '../game';
import type { Fighter } from '../fighter';
import type { VoxelModel } from '../../models/builder';
import { PropMesh } from '../characterFactory';
import { CapsuleShape, SphereShape } from '../../destruction/shapes';
import { raycastVoxels } from '../../voxel/raycast';
import { TEX_GLOW, TEX_PUFF, TEX_RING, TEX_STREAK } from '../../vfx/sprites';

const _v = new THREE.Vector3();

export interface JavelinOpts {
  speed: number;
  damage: number;
  range: number;
  /** pierce and tunnel (Luz) or detonate on the first contact (Lanza) */
  lanza: boolean;
  /** explosion radius of the Lanza (m) */
  blast?: number;
}

export class Javelin implements Projectile {
  done = false;
  readonly pos: THREE.Vector3;
  readonly dir: THREE.Vector3;
  private mesh: PropMesh;
  private light: THREE.PointLight;
  private travelled = 0;
  private t = 0;
  private hit = new Set<number>();
  private boreAcc = 0;
  private wobble = new THREE.Vector3();

  constructor(private g: Game, private owner: Fighter, model: VoxelModel, origin: THREE.Vector3, dir: THREE.Vector3, readonly o: JavelinOpts) {
    this.pos = origin.clone();
    this.dir = dir.clone().normalize();
    this.mesh = new PropMesh(model);
    this.light = new THREE.PointLight('#5CFF8A', o.lanza ? 30 : 10, o.lanza ? 14 : 8, 1.5);
    this.mesh.add(this.light);
    g.engine.gr.scene.add(this.mesh);
    this.place();
  }

  private place(): void {
    this.mesh.position.copy(this.pos);
    this.mesh.lookAt(_v.copy(this.pos).add(this.dir));
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const o = this.o;
    if (o.lanza) {
      // the flight path drifts
      this.wobble.set(Math.sin(this.t * 7.3), Math.sin(this.t * 5.1 + 1) * 0.6, Math.cos(this.t * 6.2));
      this.dir.addScaledVector(this.wobble, dt * 0.18).normalize();
    }
    const step = o.speed * dt;
    const hit = raycastVoxels(g.engine.world, this.pos.x, this.pos.y, this.pos.z, this.dir.x, this.dir.y, this.dir.z, step + 0.3);
    if (hit && o.lanza) {
      this.pos.addScaledVector(this.dir, hit.dist);
      this.detonate(g);
      return;
    }
    if (hit) {
      // Luz pierces: bore a tunnel through whatever is ahead
      this.boreAcc += dt;
      if (this.boreAcc > 1 / 40) {
        this.boreAcc = 0;
        const a = this.pos.clone(), b = this.pos.clone().addScaledVector(this.dir, step + 1.2);
        g.engine.destruction.carve(new CapsuleShape(a, b, 0.55), { mode: 'bore', power: 320, sparks: [0.45, 1, 0.6], dust: 0.6, impulse: 9 });
      }
    }
    for (const f of g.enemiesOf(this.owner)) {
      if (this.hit.has(f.id)) continue;
      const cy = Math.max(f.pos.y + 0.2, Math.min(f.pos.y + f.def.height - 0.2, this.pos.y));
      if (Math.hypot(f.pos.x - this.pos.x, cy - this.pos.y, f.pos.z - this.pos.z) < f.def.radius + 0.5) {
        if (o.lanza) {
          this.detonate(g);
          return;
        }
        this.hit.add(f.id);
        g.damage(f, o.damage, this.owner, this.dir.clone(), { energy: true, knock: 16, launch: 4, heavy: true, hitstop: 0.08, shake: 0.4 });
        g.sparks(f.center(), this.dir, '#5CFF8A', 18);
      }
    }
    this.pos.addScaledVector(this.dir, step);
    this.travelled += step;
    const glow = g.engine.glow;
    glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: -this.dir.x * 8, vy: -this.dir.y * 8, vz: -this.dir.z * 8, size: o.lanza ? 0.9 : 0.5, sizeEnd: 0.06, life: 0.3, r: 0.36, g: 1, b: 0.52, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 4 });
    if (o.lanza && Math.random() < 0.7) glow.spawn({ x: this.pos.x, y: this.pos.y, z: this.pos.z, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, vz: (Math.random() - 0.5) * 4, size: 0.3, sizeEnd: 0.04, life: 0.35, r: 0.85, g: 1, b: 0.48, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    if (this.travelled > o.range) {
      if (o.lanza) this.detonate(g);
      else this.done = true;
    }
  }

  /** Lanza: the explosion that towers over Las Noches. */
  private detonate(g: Game): void {
    if (this.done) return;
    this.done = true;
    const p = this.pos.clone();
    const R = this.o.blast ?? 6;
    g.engine.destruction.carve(new SphereShape(p, R, 0.7), { mode: 'explode', power: 1200, impulse: 26 });
    g.addProjectile(new LanzaBlast(g, p, R * 3.2));
    g.addRing(p.clone(), R * 7, '#5CFF8A', 1.2);
    g.addRing(p.clone(), R * 4.5, '#C9FFD9', 0.8);
    for (const f of g.fighters) {
      if (f.dead || f === this.owner) continue;
      const d = f.center().distanceTo(p);
      const reach = R * 2.6;
      if (d > reach) continue;
      const k = 1 - d / reach;
      // the thrower is not spared by an explosion this size, only by distance
      g.damage(f, this.o.damage * (0.35 + 0.65 * k), f.team === this.owner.team ? null : this.owner, f.pos.clone().sub(p).setY(0.4).normalize(), { energy: true, knock: 34 * k + 8, launch: 14 * k + 4, heavy: true, hitstop: 0.14, shake: 1.2 });
    }
    g.sfx.play('explode', p, 2.4);
    g.sfx.play('bankai', p, 0.8);
    if (g.player && g.player.pos.distanceTo(p) < 160) g.shake(1.3);
    g.hitstop(0.12);
    g.slowMo(0.35, 0.3);
    g.engine.gr.chroma.offset.set(0.01, 0.01);
    const dust = g.engine.dust;
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      dust.spawn({ x: p.x + Math.cos(a) * R, y: p.y, z: p.z + Math.sin(a) * R, vx: Math.cos(a) * (14 + Math.random() * 12), vy: Math.random() * 4, vz: Math.sin(a) * (14 + Math.random() * 12), size: 2, sizeEnd: 7, life: 2.2, r: 0.62, g: 0.6, b: 0.55, alpha: 0.55, alphaEnd: 0, tex: TEX_PUFF, drag: 1.4 });
    }
  }

  render(): void {
    if (!this.done) {
      this.place();
      this.mesh.rotateZ(this.t * 10);
    }
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.material.dispose();
  }
}

/** The dome of green-white light swelling over the blast, a bright core and a fading shell. */
class LanzaBlast implements Projectile {
  done = false;
  private t = 0;
  private group = new THREE.Group();
  private shell: THREE.Mesh;
  private core: THREE.Mesh;
  private light: THREE.PointLight;
  private u: Record<string, THREE.IUniform>;

  constructor(private g: Game, readonly p: THREE.Vector3, readonly R: number) {
    this.u = { uT: { value: 0 }, uTime: { value: 0 } };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.u,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `varying vec3 vN; varying vec3 vW; varying vec3 vP; void main() { vP = position; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform float uT; uniform float uTime; varying vec3 vN; varying vec3 vW; varying vec3 vP;
        float h(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
        void main() {
          vec3 v = normalize(cameraPosition - vW);
          float f = clamp(abs(dot(normalize(vN), v)), 0.0, 1.0);
          float rim = pow(1.0 - f, 2.0);
          float n = h(floor(vP * 6.0 + uTime * 3.0));
          float fade = (1.0 - uT) * (1.0 - uT);
          vec3 c = mix(vec3(0.36, 1.0, 0.5), vec3(0.85, 1.0, 0.88), f);
          gl_FragColor = vec4(c * 1.8, fade * (0.25 + rim * 0.9) * (0.85 + n * 0.15));
        }`,
    });
    this.shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 4), mat);
    this.core = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), new THREE.MeshBasicMaterial({ color: new THREE.Color('#D9FFE4').multiplyScalar(2.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.light = new THREE.PointLight('#7CFF9C', 400, R * 5, 1.4);
    this.group.add(this.shell, this.core, this.light);
    this.group.position.copy(p);
    this.group.traverse((c) => (c.frustumCulled = false));
    this.shell.renderOrder = 8;
    this.core.renderOrder = 8;
    g.engine.gr.scene.add(this.group);
  }

  update(dt: number): void {
    this.t += dt;
    const glow = this.g.engine.glow;
    if (this.t < 0.6)
      for (let i = 0; i < 10; i++) {
        const a = Math.random() * Math.PI * 2, e = Math.random() * 2 - 1, q = Math.sqrt(1 - e * e), s = 20 + Math.random() * 30;
        glow.spawn({ x: this.p.x, y: this.p.y, z: this.p.z, vx: Math.cos(a) * q * s, vy: Math.abs(e) * s, vz: Math.sin(a) * q * s, size: 0.6, sizeEnd: 0.1, life: 0.8, r: 0.6, g: 1, b: 0.7, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 4, drag: 1.5 });
      }
    if (this.t < 0.05) glow.spawn({ x: this.p.x, y: this.p.y, z: this.p.z, size: this.R * 0.6, sizeEnd: this.R * 2.4, life: 0.5, r: 0.85, g: 1, b: 0.9, alpha: 1, alphaEnd: 0, tex: TEX_RING });
    if (this.t > 2.2) this.done = true;
  }

  render(_dt: number, time: number): void {
    const k = Math.min(1, this.t / 2.2);
    const grow = 1 - Math.pow(1 - Math.min(1, this.t / 0.7), 3);
    this.shell.scale.set(this.R * grow, this.R * grow * 0.85, this.R * grow);
    this.core.scale.setScalar(this.R * 0.45 * grow * Math.max(0, 1 - k * 1.6));
    (this.core.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - k * 1.8);
    this.u.uT.value = k;
    this.u.uTime.value = time;
    this.light.intensity = 400 * (1 - k) * (1 - k);
  }

  dispose(): void {
    this.group.removeFromParent();
    this.group.traverse((c) => {
      if (c instanceof THREE.Mesh) {
        c.geometry.dispose();
        (c.material as THREE.Material).dispose();
      }
    });
  }
}
