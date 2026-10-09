// Nozarashi's effects (TYBW Kenpachi, docs/kits/kenpachi.md): the rift a Space Cut tears open — a slit of outer space
// hanging in the air along the swing, black and violet and full of stars, that sucks at whatever is near and closes;
// Nozarashi herself, shaped like Yachiru, rising as a pink spirit to pour the Bankai into his hand; the giant crimson
// blade of reiatsu The Perfect Crimson grows out of the jagged cleaver.
import * as THREE from 'three';
import type { Fighter } from '../game/fighter';
import type { Game, Projectile } from '../game/game';
import { buildCached } from '../game/characterFactory';
import { createCharMaterial, type CharMaterial } from '../render/charMaterial';
import type { VoxelModel } from '../models/builder';
import { TEX_GLOW, TEX_STREAK } from './sprites';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _m = new THREE.Matrix4();

/**
 * A tear in space: a slit along `along` (the swing's path across the view) centred at `at`, facing `facing`. It opens
 * to `width` in 0.2 s, holds, and closes by `dur`. Inside: near-black violet with stars drifting; the lips glow violet.
 */
export class SpaceRift implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.Mesh;
  private u: Record<string, THREE.IUniform>;
  readonly at: THREE.Vector3;
  readonly along: THREE.Vector3;

  constructor(private g: Game, at: THREE.Vector3, along: THREE.Vector3, facing: THREE.Vector3, readonly len = 8, readonly width = 1.4, readonly dur = 1.5) {
    this.at = at.clone();
    this.along = along.clone().normalize();
    const geo = new THREE.PlaneGeometry(1, 1, 1, 1);
    this.u = { uOpen: { value: 0 }, uTime: { value: 0 }, uSeed: { value: Math.random() * 100 } };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.u,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float uOpen; uniform float uTime; uniform float uSeed; varying vec2 vUv;
        float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed) * 43758.5453); }
        float n1(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h21(vec2(i, 1.3)), h21(vec2(i + 1.0, 1.3)), f); }
        void main() {
          // the slit: lens-shaped, pointed at both ends, its lips torn (jagged, a little different on each side)
          float x = vUv.x * 2.0 - 1.0;
          float side = vUv.y > 0.5 ? 1.0 : 0.0;
          float tear = 0.72 + 0.28 * n1(x * 14.0 + side * 37.0) + 0.12 * (h21(vec2(floor(x * 40.0), side)) - 0.5);
          float hw = uOpen * pow(max(0.0, 1.0 - x * x), 0.8) * tear;
          float y = abs(vUv.y - 0.5) * 2.0;
          if (hw < 0.004 || y > hw + 0.1) discard;
          float inside = step(y, hw);
          float lip = smoothstep(0.035, 0.0, abs(y - hw));
          float halo = smoothstep(0.1, 0.0, y - hw) * (1.0 - inside);
          // outer space: near black with a violet nebula, stars drifting along the slit and twinkling
          vec2 sp = vec2(vUv.x * 46.0 + uTime * 0.5, vUv.y * 9.0);
          vec2 cell = floor(sp);
          float st = h21(cell);
          float star = step(0.86, st) * smoothstep(0.26, 0.0, length(fract(sp) - 0.5)) * (0.55 + 0.45 * sin(uTime * 6.0 + st * 40.0));
          float neb = n1(vUv.x * 7.0 + uTime * 0.2) * n1(vUv.y * 5.0 + vUv.x * 3.0 + 9.0);
          vec3 space = vec3(0.015, 0.008, 0.03) + vec3(0.16, 0.05, 0.24) * neb * smoothstep(1.0, 0.2, abs(x));
          vec3 col = space + vec3(0.95, 0.92, 1.0) * star * 3.0;
          col = mix(col, vec3(0.85, 0.7, 1.0) * 3.2, lip);
          col += vec3(0.55, 0.3, 1.0) * halo * 1.6;
          float a = max(max(inside, lip), halo * 0.6);
          gl_FragColor = vec4(col, a);
        }`,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.renderOrder = 7;
    this.mesh.frustumCulled = false;
    this.facing = facing.clone();
    this.orient(_v.copy(at).sub(facing));
    this.mesh.position.copy(at);
    this.mesh.scale.set(len, width * 2, 1);
    g.engine.gr.scene.add(this.mesh);
  }

  private facing: THREE.Vector3;

  /** turn the slit about its own length to face `eye` (a tear in space looks like a tear from every side) */
  private orient(eye: THREE.Vector3): void {
    const xA = this.along;
    const zA = _w.subVectors(eye, this.at);
    zA.addScaledVector(xA, -zA.dot(xA));
    if (zA.lengthSq() < 1e-6) zA.copy(this.facing).negate().addScaledVector(xA, this.facing.dot(xA));
    zA.normalize();
    const yA = new THREE.Vector3().crossVectors(zA, xA).normalize();
    _m.makeBasis(xA, yA, zA);
    this.mesh.quaternion.setFromRotationMatrix(_m);
  }

  /** how far open (0-1) */
  get open(): number {
    const k = this.t / this.dur;
    return k < 0.14 ? k / 0.14 : k > 0.7 ? Math.max(0, (1 - k) / 0.3) : 1;
  }

  /** distance from a point to the slit's line segment */
  dist(p: THREE.Vector3): number {
    _v.subVectors(p, this.at);
    const s = THREE.MathUtils.clamp(_v.dot(this.along), -this.len / 2, this.len / 2);
    _w.copy(this.at).addScaledVector(this.along, s);
    return p.distanceTo(_w);
  }

  update(dt: number): void {
    this.t += dt;
    if (this.t >= this.dur) {
      this.done = true;
      return;
    }
    // star dust spills out of the lips
    if (this.open > 0.3 && Math.random() < dt * 30) {
      const s = (Math.random() - 0.5) * this.len * 0.9;
      const p = _v.copy(this.at).addScaledVector(this.along, s);
      this.g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5, vz: (Math.random() - 0.5) * 1.5, size: 0.09, sizeEnd: 0.02, life: 0.6, r: 0.85, g: 0.78, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 1 });
    }
  }

  render(_dt: number, time: number): void {
    this.orient(_v.copy(this.g.engine.gr.camera.position));
    this.u.uOpen.value = this.open;
    this.u.uTime.value = time;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

/**
 * Nozarashi as Yachiru: her figure as a pink glowing spirit rising out of the ground in front of him, hovering a moment,
 * then drifting into his right hand and fading into it (the Bankai poured into his hand).
 */
export class YachiruSpirit implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.Mesh;
  private mat: CharMaterial;
  private from = new THREE.Vector3();

  constructor(private g: Game, private f: Fighter, model: VoxelModel, readonly dur = 1.6, readonly size = 2.3) {
    const b = buildCached(model, false);
    this.mat = createCharMaterial(b.palette, b.params, model.res, { transparent: true });
    this.mat.userData.uniforms.uEnergy.value.set(1.0, 0.5, 0.75, 0.32);
    this.mat.userData.uniforms.uRim.value.set(1.0, 0.6, 0.85, 1.0);
    this.mesh = new THREE.Mesh(b.geometry, this.mat);
    this.mesh.renderOrder = 6;
    this.mesh.frustumCulled = false;
    this.mesh.scale.setScalar(size);
    // she rises at his left, where she used to ride, turned toward him
    const fw = f.forward(new THREE.Vector3());
    const left = new THREE.Vector3(fw.z, 0, -fw.x);
    this.from.copy(f.pos).addScaledVector(fw, 0.7).addScaledVector(left, 1.55);
    this.mesh.position.copy(this.from).setY(f.pos.y - 0.4 * size);
    this.mesh.rotation.y = f.yaw - Math.PI / 2 + 0.6;
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number): void {
    this.t += dt;
    if (this.t >= this.dur) this.done = true;
    if (Math.random() < dt * 40) {
      const p = this.mesh.position, s = this.mesh.scale.x;
      this.g.engine.glow.spawn({ x: p.x + (Math.random() - 0.5) * 0.25 * s, y: p.y + (Math.random() - 0.3) * 0.45 * s, z: p.z + (Math.random() - 0.5) * 0.25 * s, vx: 0, vy: 0.8 + Math.random(), vz: 0, size: 0.12, sizeEnd: 0.02, life: 0.7, r: 1, g: 0.6, b: 0.8, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 1 });
    }
  }

  render(): void {
    const k = this.t / this.dur;
    const f = this.f;
    // rise (0-0.35), hover (0.35-0.6), drift into the hand (0.6-1)
    const hand = f.visual.rig.sockets.get('grip.R');
    const hp = hand ? hand.getWorldPosition(_v) : f.center(_v);
    const s = this.size;
    const lo = f.pos.y - 0.4 * s, hi = f.pos.y + 1.25;
    if (k < 0.35) {
      const r = k / 0.35;
      this.mesh.position.set(this.from.x, lo + (1 - (1 - r) ** 3) * (hi - lo), this.from.z);
      this.mat.userData.uniforms.uAlpha.value = r;
    } else if (k < 0.6) {
      this.mesh.position.set(this.from.x, hi + Math.sin(this.t * 6) * 0.05, this.from.z);
      this.mat.userData.uniforms.uAlpha.value = 1;
    } else {
      const r = (k - 0.6) / 0.4;
      _w.set(this.from.x, hi, this.from.z).lerp(hp, r * r);
      this.mesh.position.copy(_w).setY(_w.y - 0.3 * r);
      this.mesh.scale.setScalar(s * (1 - 0.8 * r));
      this.mat.userData.uniforms.uAlpha.value = 1 - r;
    }
    this.mat.userData.uniforms.uTime.value = this.t;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mat.dispose();
  }
}

/**
 * The Perfect Crimson's blade: a blade of crimson reiatsu `len` long grown out of the jagged cleaver (the 'sword' prop,
 * blade along its +Z), two crossed glowing sheets so it reads from any side. `grow` 0-1 drives its length; it follows the
 * prop each frame until `done` is set by the kit.
 */
export class CrimsonBlade implements Projectile {
  done = false;
  grow = 0;
  private group = new THREE.Group();
  private mats: THREE.ShaderMaterial[] = [];

  constructor(g: Game, private f: Fighter, readonly len = 30, readonly width = 3.2) {
    for (const rot of [0, Math.PI / 2]) {
      const geo = new THREE.PlaneGeometry(1, 1);
      geo.translate(0, 0.5, 0);
      const mat = new THREE.ShaderMaterial({
        uniforms: { uT: { value: 0 }, uA: { value: 0 } },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform float uT; uniform float uA; varying vec2 vUv;
          float h(float n) { return fract(sin(n * 91.7) * 43758.5453); }
          void main() {
            float across = abs(vUv.x - 0.5) * 2.0;
            // a jagged cleaver of reiatsu: notched teeth along the edge, a point at the tip, flickering
            float seg = floor(vUv.y * 22.0);
            float teeth = 0.78 + 0.22 * h(seg + floor(uT * 9.0) * 0.37);
            float w = (1.0 - smoothstep(0.8, 1.0, vUv.y)) * teeth * (0.93 + 0.07 * sin(vUv.y * 60.0 - uT * 14.0));
            if (across > w) discard;
            float edge = smoothstep(w * 0.55, w, across);
            float core = pow(max(0.0, 1.0 - across / max(0.04, w * 0.35)), 2.0);
            vec3 col = mix(vec3(1.0, 0.28, 0.08), vec3(0.42, 0.02, 0.03), edge) + vec3(1.0, 0.75, 0.45) * core * 0.9;
            gl_FragColor = vec4(col * 1.7, (0.82 + 0.18 * core) * uA);
          }`,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.y = rot;
      mesh.frustumCulled = false;
      mesh.renderOrder = 6;
      this.group.add(mesh);
      this.mats.push(mat);
    }
    g.engine.gr.scene.add(this.group);
  }

  update(): void {}

  render(_dt: number, time: number): void {
    const s = this.f.visual.props.get('sword');
    if (!s) {
      this.group.visible = false;
      return;
    }
    s.updateWorldMatrix(true, false);
    // the prop's +Z (the blade) becomes the sheets' +Y
    const o = _v.setFromMatrixPosition(s.matrixWorld);
    const z = _w.set(0, 0, 1).transformDirection(s.matrixWorld);
    const x = new THREE.Vector3(1, 0, 0).transformDirection(s.matrixWorld);
    const y = z.clone();
    const zz = new THREE.Vector3().crossVectors(x, y).normalize();
    x.crossVectors(y, zz).normalize();
    _m.makeBasis(x, y, zz);
    this.group.quaternion.setFromRotationMatrix(_m);
    this.group.position.copy(o).addScaledVector(y, 0.3);
    const L = 0.6 + this.len * this.grow;
    this.group.scale.set(this.width * (0.4 + 0.6 * this.grow), L, this.width * (0.4 + 0.6 * this.grow));
    for (const m of this.mats) {
      m.uniforms.uT.value = time;
      m.uniforms.uA.value = Math.min(1, this.grow * 3);
    }
    // embers streaming off it
    if (this.grow > 0.2 && Math.random() < 0.6) {
      const p = _w.copy(o).addScaledVector(y, Math.random() * L);
      this.f.game.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 2, vy: 1 + Math.random() * 2, vz: (Math.random() - 0.5) * 2, size: 0.25, sizeEnd: 0.04, life: 0.6, r: 1, g: 0.4, b: 0.1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2, drag: 1 });
    }
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const c of this.group.children) (c as THREE.Mesh).geometry.dispose();
    for (const m of this.mats) m.dispose();
  }
}
