// Hadō #90 Kurohitsugi, the Black Coffin: black slabs fly in from all sides and lock into a box around
// the target, violet light crawling along the seams; spear-like stakes punch through the walls one after
// another; then the coffin cracks apart into tumbling shards. The target is held for the duration.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { TEX_GLOW, TEX_STREAK } from './sprites';

const VERT = /* glsl */ `varying vec3 vN; varying vec3 vW; varying vec2 vUv; void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;
const SLAB_FRAG = /* glsl */ `
uniform float uTime; uniform float uCrack; varying vec3 vN; varying vec3 vW; varying vec2 vUv;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec3 v = normalize(cameraPosition - vW);
  float f = abs(dot(normalize(vN), v));
  vec2 g = abs(vUv - 0.5) * 2.0;
  float edge = smoothstep(0.82, 1.0, max(g.x, g.y));
  // jagged violet cracks spreading as the coffin fails
  float n = h(floor(vUv * 9.0 + floor(uTime * 6.0)));
  float crack = step(1.0 - uCrack * 0.5, n) * uCrack;
  vec3 col = vec3(0.045, 0.04, 0.055) + vec3(0.36, 0.17, 0.53) * (edge * 1.6 + (1.0 - f) * 0.6 + crack * 2.5);
  gl_FragColor = vec4(col, 0.97);
}`;

interface Slab {
  mesh: THREE.Mesh;
  to: THREE.Vector3;
  from: THREE.Vector3;
  q: THREE.Quaternion;
  spin: THREE.Vector3;
  vel: THREE.Vector3;
}

interface Stake {
  mesh: THREE.Mesh;
  from: THREE.Vector3;
  to: THREE.Vector3;
  t0: number;
}

export class BlackCoffin implements Projectile {
  done = false;
  private t = 0;
  private group = new THREE.Group();
  private slabs: Slab[] = [];
  private stakes: Stake[] = [];
  private u: Record<string, THREE.IUniform>;
  private center = new THREE.Vector3();
  private hold = new THREE.Vector3();
  private ticks = 0;
  private broken = false;
  private light: THREE.PointLight;

  /**
   * @param size coffin half extents (m)
   * @param damage total damage dealt (ticks while closed + the break)
   */
  constructor(private g: Game, private owner: Fighter, private target: Fighter | null, at: THREE.Vector3, readonly damage = 160, readonly scale = 1, readonly closeT = 0.5, readonly holdT = 1.3) {
    this.center.copy(at);
    this.hold.copy(target ? target.pos : at);
    this.u = { uTime: { value: 0 }, uCrack: { value: 0 } };
    const mat = new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: VERT, fragmentShader: SLAB_FRAG, transparent: true, side: THREE.DoubleSide });
    const hx = 0.95 * scale, hy = 1.45 * scale, hz = 0.95 * scale, th = 0.09 * scale;
    // six faces: [size, offset normal]
    const faces: [THREE.Vector3, THREE.Vector3][] = [
      [new THREE.Vector3(hx * 2, hy * 2, th), new THREE.Vector3(0, 0, hz)],
      [new THREE.Vector3(hx * 2, hy * 2, th), new THREE.Vector3(0, 0, -hz)],
      [new THREE.Vector3(th, hy * 2, hz * 2), new THREE.Vector3(hx, 0, 0)],
      [new THREE.Vector3(th, hy * 2, hz * 2), new THREE.Vector3(-hx, 0, 0)],
      [new THREE.Vector3(hx * 2 + th, th, hz * 2 + th), new THREE.Vector3(0, hy, 0)],
      [new THREE.Vector3(hx * 2 + th, th, hz * 2 + th), new THREE.Vector3(0, -hy, 0)],
    ];
    for (const [sz, off] of faces) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sz.x, sz.y, sz.z), mat);
      const to = off.clone();
      const from = off.clone().normalize().multiplyScalar(9 * scale).add(new THREE.Vector3((Math.random() - 0.5) * 4, 3 + Math.random() * 3, (Math.random() - 0.5) * 4));
      m.position.copy(from);
      m.renderOrder = 4;
      this.group.add(m);
      this.slabs.push({ mesh: m, to, from, q: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 3, Math.random() * 3, Math.random() * 3)), spin: new THREE.Vector3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8), vel: new THREE.Vector3() });
    }
    // stakes: long black spears that punch inward through the walls
    const sg = new THREE.ConeGeometry(0.07 * scale, 2.6 * scale, 5);
    sg.rotateX(Math.PI / 2);
    const sm = new THREE.MeshBasicMaterial({ color: '#1B1024' });
    for (let i = 0; i < 12; i++) {
      const dir = new THREE.Vector3(Math.random() - 0.5, (Math.random() - 0.5) * 0.8, Math.random() - 0.5).normalize();
      const from = dir.clone().multiplyScalar(2.6 * scale);
      const to = dir.clone().multiplyScalar(0.1 * scale);
      const m = new THREE.Mesh(sg, sm);
      m.visible = false;
      m.position.copy(from);
      m.lookAt(to);
      this.group.add(m);
      this.stakes.push({ mesh: m, from, to, t0: closeT + 0.1 + (i / 12) * (holdT - 0.3) });
    }
    this.light = new THREE.PointLight('#8A4DFF', 0, 12 * scale, 1.6);
    this.group.add(this.light);
    this.group.position.copy(this.center);
    this.group.traverse((c) => (c.frustumCulled = false));
    g.engine.gr.scene.add(this.group);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const tgt = this.target;
    // follow and hold the target while the coffin closes and stands
    if (tgt && !tgt.dead && !this.broken) {
      if (this.t < this.closeT) this.center.lerp(new THREE.Vector3(tgt.pos.x, tgt.pos.y + 1.2 * this.scale, tgt.pos.z), Math.min(1, dt * 10));
      else {
        tgt.body.pos.set(this.center.x, this.center.y - 1.2 * this.scale, this.center.z);
        tgt.body.vel.set(0, 0, 0);
        tgt.hitstun = Math.max(tgt.hitstun, 0.25);
      }
      this.group.position.copy(this.center);
    }
    // stakes ticks
    if (this.t > this.closeT && !this.broken) {
      const want = Math.floor((this.t - this.closeT) / 0.12);
      while (this.ticks < want) {
        this.ticks++;
        if (tgt && !tgt.dead && tgt.pos.distanceTo(new THREE.Vector3(this.center.x, this.center.y - 1.2 * this.scale, this.center.z)) < 2 * this.scale)
          g.damage(tgt, (this.damage * 0.45) / (this.holdT / 0.12), this.owner, new THREE.Vector3(0, 0, 0), { quiet: true });
      }
    }
    if (!this.broken && this.t >= this.closeT + this.holdT) {
      this.broken = true;
      // the break: the final cut and the shards fly
      if (tgt && !tgt.dead) {
        const d = tgt.center().distanceTo(this.center);
        if (d < 2.5 * this.scale) g.damage(tgt, this.damage * 0.55, this.owner, new THREE.Vector3(0, 1, 0), { knock: 6, launch: 7, heavy: true, hitstop: 0.12, shake: 0.6 });
      }
      for (const s of this.slabs) s.vel.copy(s.to).normalize().multiplyScalar(6 + Math.random() * 6).add(new THREE.Vector3(0, 3, 0));
      g.sfx.play('shatter', this.center, 1.2);
      const glow = g.engine.glow;
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2, e = Math.random() * 2 - 1, q = Math.sqrt(1 - e * e), sp = 4 + Math.random() * 9;
        glow.spawn({ x: this.center.x, y: this.center.y, z: this.center.z, vx: Math.cos(a) * q * sp, vy: e * sp, vz: Math.sin(a) * q * sp, size: 0.18, sizeEnd: 0.03, life: 0.6, r: 0.55, g: 0.3, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 2 });
      }
    }
    if (this.t > this.closeT + this.holdT + 1.1) this.done = true;
  }

  render(dt: number, time: number): void {
    const t = this.t;
    this.u.uTime.value = time;
    const k = Math.min(1, t / this.closeT);
    const e = 1 - (1 - k) ** 3;
    for (const s of this.slabs) {
      if (!this.broken) {
        s.mesh.position.lerpVectors(s.from, s.to, e);
        s.mesh.quaternion.slerpQuaternions(s.q, new THREE.Quaternion(), e);
      } else {
        s.vel.y -= 14 * dt;
        s.mesh.position.addScaledVector(s.vel, dt);
        s.mesh.rotation.x += s.spin.x * dt;
        s.mesh.rotation.y += s.spin.y * dt;
        s.mesh.rotation.z += s.spin.z * dt;
        s.mesh.scale.multiplyScalar(Math.exp(-dt * 1.6));
      }
    }
    this.u.uCrack.value = this.broken ? 1 : Math.max(0, (t - this.closeT) / this.holdT);
    for (const st of this.stakes) {
      const u = (t - st.t0) / 0.1;
      st.mesh.visible = !this.broken && u > 0;
      if (u > 0) st.mesh.position.lerpVectors(st.from, st.to, Math.min(1, u));
    }
    this.light.intensity = this.broken ? Math.max(0, 40 - (t - this.closeT - this.holdT) * 60) : 8 + k * 14;
    if (!this.broken && t > this.closeT && Math.random() < 0.4) {
      const g = this.g.engine.glow;
      const p = this.center;
      g.spawn({ x: p.x + (Math.random() - 0.5) * 2 * this.scale, y: p.y + (Math.random() - 0.5) * 3 * this.scale, z: p.z + (Math.random() - 0.5) * 2 * this.scale, size: 0.2, sizeEnd: 0.02, life: 0.4, r: 0.6, g: 0.35, b: 1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
  }

  dispose(): void {
    this.group.removeFromParent();
    const seen = new Set<unknown>();
    this.group.traverse((c) => {
      if (c instanceof THREE.Mesh) {
        if (!seen.has(c.geometry)) { seen.add(c.geometry); c.geometry.dispose(); }
        if (!seen.has(c.material)) { seen.add(c.material); (c.material as THREE.Material).dispose(); }
      }
    });
  }
}
