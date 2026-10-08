// Cero: a charge sphere swelling at the emitter (particles drawn in, red light, ground dust), then a
// beam that drills through the world — each step the beam is raycast to the first solid voxel and a
// bore is carved there, so it tunnels through buildings — ending in an explosion. Hits fighters
// along the beam and in the blast.
import * as THREE from 'three';
import type { Game, Projectile } from '../game';
import type { Fighter } from '../fighter';
import { CapsuleShape, SphereShape } from '../../destruction/shapes';
import { raycastVoxels } from '../../voxel/raycast';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from '../../vfx/sprites';

const _c = new THREE.Vector3();

export interface CeroOpts {
  charge: number;
  fire: number;
  radius: number;
  damage: number;
  power: number;
  core: THREE.ColorRepresentation;
  body: THREE.ColorRepresentation;
  rim: THREE.ColorRepresentation;
  range: number;
  /** turn rate toward the target while firing (rad/s) */
  track: number;
  /** Gran Rey Cero: spinning rings that compress and decompress along the beam */
  spiral?: boolean;
  /** colour gain (default 2.2): lower keeps saturated colours from blooming to white */
  gain?: number;
  /** released-Espada Cero (Cero Oscuras): a near-black core drawn over the glow, which then reads as a rim */
  dark?: THREE.ColorRepresentation;
}

const DARK_FRAG = /* glsl */ `
uniform float uTime; uniform float uA; uniform vec3 uCol;
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
void main() {
  vec3 v = normalize(cameraPosition - vW);
  float f = abs(dot(normalize(vN), v));
  float n = n2(vec2(vUv.x * 8.0, vUv.y * 40.0 - uTime * 30.0));
  gl_FragColor = vec4(uCol, uA * smoothstep(0.12, 0.55, f) * (0.82 + n * 0.18));
}`;

const BEAM_FRAG = /* glsl */ `
uniform float uTime; uniform float uA; uniform float uGain; uniform vec3 uCore; uniform vec3 uBody; uniform vec3 uRim;
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
void main() {
  vec3 v = normalize(cameraPosition - vW);
  float f = abs(dot(normalize(vN), v));
  float n = n2(vec2(vUv.x * 10.0, vUv.y * 60.0 - uTime * 40.0)) * 0.6 + n2(vec2(vUv.x * 23.0, vUv.y * 140.0 - uTime * 70.0)) * 0.4;
  float core = pow(f, 3.0);
  vec3 col = mix(uRim, uBody, smoothstep(0.1, 0.6, f + n * 0.2));
  col = mix(col, uCore * (1.0 + uGain * 0.7), core);
  float a = uA * (0.25 + f * 0.9) * (0.75 + n * 0.5);
  gl_FragColor = vec4(col * uGain, a);
}`;

export class CeroBeam implements Projectile {
  done = false;
  private t = 0;
  private group = new THREE.Group();
  private sphere: THREE.Mesh;
  private beam: THREE.Mesh;
  private light: THREE.PointLight;
  private beamU: Record<string, THREE.IUniform>;
  private sphU: Record<string, THREE.IUniform>;
  readonly dir = new THREE.Vector3();
  private impact = new THREE.Vector3();
  private hitT = new Map<number, number>();
  private exploded = false;
  private carveAcc = 0;
  private core: THREE.Color;
  private body: THREE.Color;
  private rings: THREE.Mesh[] = [];
  private darkBeam: THREE.Mesh | null = null;
  private darkSphere: THREE.Mesh | null = null;
  private darkU: Record<string, THREE.IUniform> | null = null;

  /**
   * @param emitter world-space object whose position is the muzzle (e.g. a socket)
   * @param target  point to aim at (updated by tracking)
   */
  constructor(private g: Game, private owner: Fighter, private emitter: THREE.Object3D, private target: () => THREE.Vector3, readonly o: CeroOpts) {
    this.core = new THREE.Color(o.core);
    this.body = new THREE.Color(o.body);
    const gain = o.gain ?? 2.2;
    this.sphU = { uTime: { value: 0 }, uA: { value: 1 }, uGain: { value: gain }, uCore: { value: this.core.clone() }, uBody: { value: this.body.clone() }, uRim: { value: new THREE.Color(o.rim) } };
    this.beamU = { uTime: { value: 0 }, uA: { value: 0 }, uGain: { value: gain }, uCore: { value: this.core.clone() }, uBody: { value: this.body.clone() }, uRim: { value: new THREE.Color(o.rim) } };
    const vert = `varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;
    const mk = (u: Record<string, THREE.IUniform>) => new THREE.ShaderMaterial({ uniforms: u, vertexShader: vert, fragmentShader: BEAM_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    this.sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), mk(this.sphU));
    const bg = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true);
    bg.translate(0, 0.5, 0);
    bg.rotateX(Math.PI / 2); // along +Z
    this.beam = new THREE.Mesh(bg, mk(this.beamU));
    this.beam.visible = false;
    this.light = new THREE.PointLight(this.body, 0, 40, 1.5);
    this.group.add(this.sphere, this.beam, this.light);
    if (o.spiral) {
      const rg = new THREE.TorusGeometry(1, 0.07, 6, 28);
      const rm = mk(this.beamU);
      for (let i = 0; i < 7; i++) {
        const r = new THREE.Mesh(rg, rm);
        r.visible = false;
        r.renderOrder = 7;
        this.rings.push(r);
        this.group.add(r);
      }
    }
    if (o.dark) {
      this.darkU = { uTime: { value: 0 }, uA: { value: 0 }, uCol: { value: new THREE.Color(o.dark) } };
      const dm = new THREE.ShaderMaterial({ uniforms: this.darkU, vertexShader: vert, fragmentShader: DARK_FRAG, transparent: true, depthWrite: false, blending: THREE.NormalBlending, side: THREE.FrontSide });
      this.darkBeam = new THREE.Mesh(bg, dm);
      this.darkSphere = new THREE.Mesh(this.sphere.geometry, dm);
      this.darkBeam.renderOrder = this.darkSphere.renderOrder = 8;
      this.darkBeam.visible = false;
      this.group.add(this.darkBeam, this.darkSphere);
    }
    this.group.traverse((c) => (c.frustumCulled = false));
    this.sphere.renderOrder = this.beam.renderOrder = 7;
    g.engine.gr.scene.add(this.group);
    this.dir.subVectors(target(), this.muzzle()).normalize();
  }

  private muzzle(out = new THREE.Vector3()): THREE.Vector3 {
    this.emitter.updateWorldMatrix(true, false);
    return this.emitter.getWorldPosition(out);
  }

  update(dt: number, g: Game): void {
    if (this.owner.dead && this.t < this.o.charge) {
      this.done = true;
      return;
    }
    this.t += dt;
    const m = this.muzzle();
    const o = this.o;
    if (this.t < o.charge) {
      // charging: particles stream in, the sphere swells
      const k = this.t / o.charge;
      const glow = g.engine.glow;
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2, b = Math.acos(Math.random() * 2 - 1);
        const r = o.radius * (3 + Math.random() * 4);
        const px = m.x + Math.sin(b) * Math.cos(a) * r, py = m.y + Math.cos(b) * r, pz = m.z + Math.sin(b) * Math.sin(a) * r;
        const c = Math.random() < 0.4 ? this.core : this.body;
        glow.spawn({ x: px, y: py, z: pz, vx: (m.x - px) * 2.2, vy: (m.y - py) * 2.2, vz: (m.z - pz) * 2.2, size: 0.5 + k, sizeEnd: 0.1, life: 0.45, r: c.r, g: c.g, b: c.b, alpha: 0.9, alphaEnd: 0.2, tex: TEX_STREAK, stretch: 3, drag: 0 });
      }
      if (Math.random() < 0.3 && g.player && g.player.pos.distanceTo(m) < 80) g.shake(0.04 + k * 0.08);
      // keep aiming during the charge
      this.dir.lerp(new THREE.Vector3().subVectors(this.target(), m).normalize(), Math.min(1, dt * 3)).normalize();
      return;
    }
    const ft = this.t - o.charge;
    if (ft < o.fire) {
      // track the target slowly
      const want = new THREE.Vector3().subVectors(this.target(), m).normalize();
      const ang = this.dir.angleTo(want);
      if (ang > 1e-4) this.dir.lerp(want, Math.min(1, (o.track * dt) / ang)).normalize();
      // beam end: first solid voxel along the ray
      const hit = raycastVoxels(g.engine.world, m.x, m.y, m.z, this.dir.x, this.dir.y, this.dir.z, o.range);
      let len = hit ? hit.dist : o.range;
      // a fighter catching the beam on a blade: it ends there
      let caught = false;
      for (const f of g.enemiesOf(this.owner)) {
        if (!f.beamStop) continue;
        const c = f.center();
        const along = _c.subVectors(c, m).dot(this.dir);
        if (along < 0 || along > len) continue;
        if (_c.copy(m).addScaledVector(this.dir, along).distanceTo(c) > f.def.radius + o.radius + 0.3) continue;
        len = Math.max(0.3, along - f.def.radius * 0.6);
        caught = true;
      }
      this.impact.copy(m).addScaledVector(this.dir, len);
      // drill: carve at the impact (bore), repeatedly
      this.carveAcc += dt;
      if (hit && !caught && this.carveAcc > 1 / 30) {
        this.carveAcc = 0;
        const a = this.impact.clone().addScaledVector(this.dir, -o.radius * 0.5);
        const b = this.impact.clone().addScaledVector(this.dir, o.radius * 2.2);
        g.engine.destruction.carve(new CapsuleShape(a, b, o.radius * 1.15), { mode: 'bore', power: o.power, sparks: [this.body.r, this.body.g, this.body.b], dust: 0.7, impulse: 10 });
        const dust = g.engine.dust;
        for (let i = 0; i < 3; i++) dust.spawn({ x: this.impact.x, y: this.impact.y, z: this.impact.z, vx: (Math.random() - 0.5) * 10 - this.dir.x * 6, vy: Math.random() * 6, vz: (Math.random() - 0.5) * 10 - this.dir.z * 6, size: 1.2, sizeEnd: 4, life: 1.2, r: 0.5, g: 0.45, b: 0.42, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 1.5 });
      }
      // hurt fighters along the beam (ticks)
      for (const f of g.enemiesOf(this.owner)) {
        const c = f.center();
        const t = Math.max(0, Math.min(len, new THREE.Vector3().subVectors(c, m).dot(this.dir)));
        const p = m.clone().addScaledVector(this.dir, t);
        if (p.distanceTo(c) < o.radius + f.def.radius) {
          const last = this.hitT.get(f.id) ?? -1;
          if (this.t - last > 0.25) {
            this.hitT.set(f.id, this.t);
            g.damage(f, o.damage * 0.25, this.owner, this.dir, { energy: true, knock: 12, launch: 3, heavy: true, hitstop: 0.04, shake: 0.5 });
          }
        }
      }
      if (g.player && g.player.pos.distanceTo(this.impact) < 60) g.shake(0.06);
      return;
    }
    if (!this.exploded) {
      this.exploded = true;
      g.sfx.play('explode', this.impact, 1.6);
      g.engine.destruction.carve(new SphereShape(this.impact.clone(), o.radius * 3, 0.8), { mode: 'explode', power: o.power, impulse: 18 });
      g.addRing(this.impact.clone(), o.radius * 9, o.body, 0.8);
      for (const f of g.enemiesOf(this.owner)) {
        const d = f.center().distanceTo(this.impact);
        if (d < o.radius * 4) g.damage(f, o.damage * (1 - d / (o.radius * 4)), this.owner, f.pos.clone().sub(this.impact).setY(0.3).normalize(), { energy: true, knock: 20, launch: 8, heavy: true, hitstop: 0.1, shake: 0.8 });
      }
      if (g.player && g.player.pos.distanceTo(this.impact) < 80) g.shake(0.7);
    }
    if (ft > o.fire + 0.5) this.done = true;
  }

  render(_dt: number, time: number): void {
    const o = this.o;
    const m = this.muzzle();
    this.sphU.uTime.value = this.beamU.uTime.value = time;
    if (this.t < o.charge) {
      const k = this.t / o.charge;
      const r = o.radius * (0.15 + 1.15 * Math.pow(k, 1.6)) * (1 + Math.sin(time * 30) * 0.05);
      this.sphere.position.copy(m);
      this.sphere.scale.setScalar(r);
      // a black Cero's orb: the glow kept to a thin rim, or its bloom would wash the black core out
      this.sphU.uA.value = (0.5 + k * 0.5) * (this.darkSphere ? 0.3 : 1);
      this.light.position.copy(m);
      this.light.intensity = (20 + k * 120) * (this.darkSphere ? 0.4 : 1);
      this.beam.visible = false;
      if (this.darkSphere && this.darkU) {
        this.darkSphere.position.copy(m);
        this.darkSphere.scale.setScalar(r * 0.9);
        this.darkU.uA.value = 0.6 + k * 0.35;
        this.darkU.uTime.value = time;
      }
      return;
    }
    const ft = this.t - o.charge;
    const fireA = ft < o.fire ? Math.min(1, ft * 12) : Math.max(0, 1 - (ft - o.fire) * 3);
    this.beam.visible = fireA > 0.01;
    const len = Math.max(0.1, this.impact.distanceTo(m));
    this.beam.position.copy(m);
    this.beam.lookAt(this.impact);
    const pulse = 1 + Math.sin(time * 45) * 0.06;
    this.beam.scale.set(o.radius * pulse, o.radius * pulse, len);
    this.beamU.uA.value = fireA;
    this.sphere.position.copy(m);
    this.sphere.scale.setScalar(o.radius * 1.3 * Math.max(0.3, fireA));
    this.sphU.uA.value = fireA;
    this.light.position.copy(this.impact);
    this.light.intensity = 160 * fireA;
    if (this.darkBeam && this.darkSphere && this.darkU) {
      this.darkBeam.visible = this.beam.visible;
      this.darkBeam.position.copy(m);
      this.darkBeam.quaternion.copy(this.beam.quaternion);
      this.darkBeam.scale.set(o.radius * pulse * 0.72, o.radius * pulse * 0.72, len);
      this.darkSphere.position.copy(m);
      this.darkSphere.scale.setScalar(o.radius * 1.0 * Math.max(0.3, fireA));
      this.darkU.uA.value = fireA * 0.92;
      this.darkU.uTime.value = time;
    }
    // spiral rings ride the beam outward, spinning and pulsing
    for (let i = 0; i < this.rings.length; i++) {
      const r = this.rings[i];
      r.visible = this.beam.visible;
      if (!r.visible) continue;
      const u = ((ft * 0.9 + i / this.rings.length) % 1);
      r.position.copy(m).addScaledVector(this.dir, u * len);
      r.lookAt(r.position.clone().add(this.dir));
      r.rotateZ(time * 9 + i);
      const pulse = 1.35 + Math.sin(time * 14 + i * 1.7) * 0.35;
      r.scale.setScalar(o.radius * pulse * (0.6 + u * 0.8));
    }
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
