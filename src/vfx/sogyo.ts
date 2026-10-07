// Jūshirō Ukitake's effects (docs/roster/B3-captains-3.md). SogyoRope: the long red rope tying the two
// hilts of Sōgyo no Kotowari together, five square silver charms hanging from it — a verlet chain pinned to
// the two pommels, drawn as a string of small red cubes. The charms light white-gold as the left blade drinks
// an attack (one per fifth of the store), and a pulse of the stored attack's colour runs down the rope from
// the left hilt to the right when it is caught and again when it is fired back. EnergyCatch: the attack
// swallowed by the left blade (a swirl of its colour sucked into the steel). SekiDisc: Bakudō #8 Seki, a
// flat disc of pale light thrown out of the palm that bounces whoever it meets.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { TEX_GLOW, TEX_RING, TEX_STREAK } from './sprites';

const N = 26;
const ROPE_LEN = 1.75;
const ROPE = new THREE.Color('#B32025');
const CHARM = new THREE.Color('#C3C8CD');
const PULSE = new THREE.Color('#FFF2C9');

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const DOWN = new THREE.Vector3(0, -1, 0);
const UP = new THREE.Vector3(0, 1, 0);

export class SogyoRope implements Projectile {
  done = false;
  /** 0..1: how full the store is (lights the charms) */
  fill = 0;
  /** extra glow on the charms (the overdrive) */
  blaze = 0;
  /** the stored attack's colour */
  readonly color = new THREE.Color('#FFF2C9');
  readonly p: THREE.Vector3[] = [];
  private prev: THREE.Vector3[] = [];
  private cubes: THREE.InstancedMesh;
  private charms: THREE.InstancedMesh;
  private charmMat: THREE.MeshStandardMaterial;
  private pulses: { u: number; dir: 1 | -1; c: THREE.Color }[] = [];
  private inited = false;
  private hidden = false;

  /** the rope's ends: the two pommels (prop space → world through the props' matrices) */
  constructor(private g: Game, private owner: Fighter, private ends: () => [THREE.Vector3, THREE.Vector3] | null) {
    for (let i = 0; i < N; i++) {
      this.p.push(new THREE.Vector3());
      this.prev.push(new THREE.Vector3());
    }
    const cube = new THREE.BoxGeometry(1, 1, 1);
    // white bases: the instance colours carry the rope's red and the charms' silver
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, emissive: ROPE, emissiveIntensity: 0.12 });
    // two cubes per segment so the rope stays solid as it stretches
    this.cubes = new THREE.InstancedMesh(cube, mat, N * 2);
    this.cubes.castShadow = true;
    this.charmMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.85, emissive: new THREE.Color('#FFF2C9'), emissiveIntensity: 0 });
    this.charms = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), this.charmMat, 5);
    this.charms.castShadow = true;
    for (const m of [this.cubes, this.charms]) {
      m.frustumCulled = false;
      g.engine.gr.scene.add(m);
    }
  }

  /** a pulse of colour running down the rope (+1: left hilt → right hilt) */
  pulse(c: THREE.ColorRepresentation, dir: 1 | -1 = 1): void {
    this.pulses.push({ u: 0, dir, c: new THREE.Color(c) });
  }

  /** the rope's points (world), for hit tests: the lash */
  get points(): THREE.Vector3[] {
    return this.p;
  }

  /** fling the rope out (the lash): the middle bows out along `dir` */
  fling(dir: THREE.Vector3, speed: number): void {
    const h = 1 / 60;
    for (let i = 1; i < N - 1; i++) {
      const k = Math.sin((i / (N - 1)) * Math.PI);
      this.prev[i].addScaledVector(dir, -speed * k * h);
      this.prev[i].y -= speed * 0.3 * k * h;
    }
  }

  setHidden(on: boolean): void {
    this.hidden = on;
  }

  end(): void {
    this.done = true;
  }

  update(): void {
    if (!this.g.fighters.includes(this.owner)) this.done = true;
  }

  render(dt: number, time: number): void {
    const e = this.ends();
    const vis = !!e && !this.hidden && !this.owner.dead;
    this.cubes.visible = this.charms.visible = vis;
    if (!e || !vis) {
      this.inited = false;
      return;
    }
    const [a, b] = e;
    if (!this.inited) {
      // hang it as a sagging curve between the hands
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        this.p[i].lerpVectors(a, b, t);
        this.p[i].y -= Math.sin(t * Math.PI) * 0.5;
        this.prev[i].copy(this.p[i]);
      }
      this.inited = true;
    }
    // verlet: gravity, a little air drag, the ends pinned to the pommels
    const h = Math.min(dt, 1 / 30);
    for (let i = 1; i < N - 1; i++) {
      const q = this.p[i], o = this.prev[i];
      _v.subVectors(q, o).multiplyScalar(0.96);
      o.copy(q);
      q.add(_v);
      q.y -= 9.8 * h * h;
    }
    this.p[0].copy(a);
    this.p[N - 1].copy(b);
    const seg = ROPE_LEN / (N - 1);
    for (let it = 0; it < 10; it++) {
      for (let i = 0; i < N - 1; i++) {
        const q0 = this.p[i], q1 = this.p[i + 1];
        _v.subVectors(q1, q0);
        const d = _v.length() || 1e-6;
        const k = (d - seg) / d;
        const w0 = i === 0 ? 0 : 0.5, w1 = i + 1 === N - 1 ? 0 : 0.5;
        if (w0 + w1 === 0) continue;
        const s = k / (w0 + w1);
        q0.addScaledVector(_v, s * w0);
        q1.addScaledVector(_v, -s * w1);
      }
      // never through the floor
      for (let i = 1; i < N - 1; i++) if (this.p[i].y < this.owner.pos.y + 0.03) this.p[i].y = this.owner.pos.y + 0.03;
    }
    // pulses travelling along the rope
    for (const pl of this.pulses) pl.u += dt * 2.2;
    this.pulses = this.pulses.filter((pl) => pl.u < 1.15);
    // cubes: two per segment, oriented along the rope
    const size = 0.034;
    let n = 0;
    const col = new THREE.Color();
    for (let i = 0; i < N - 1; i++) {
      const q0 = this.p[i], q1 = this.p[i + 1];
      _w.subVectors(q1, q0).normalize();
      _q.setFromUnitVectors(_v.set(0, 0, 1), _w);
      for (const f of [0.25, 0.75]) {
        _s.set(size, size, size * 1.5);
        _m.compose(_v.lerpVectors(q0, q1, f), _q, _s);
        this.cubes.setMatrixAt(n, _m);
        // a pulse lights the cubes it passes
        const u = (i + f) / (N - 1);
        col.copy(ROPE);
        for (const pl of this.pulses) {
          const at = pl.dir > 0 ? pl.u : 1 - pl.u;
          const k = Math.max(0, 1 - Math.abs(u - at) * 9);
          if (k > 0) col.lerp(pl.c, k).lerp(PULSE, k * 0.4);
        }
        this.cubes.setColorAt(n, col);
        n++;
      }
    }
    this.cubes.count = n;
    this.cubes.instanceMatrix.needsUpdate = true;
    if (this.cubes.instanceColor) this.cubes.instanceColor.needsUpdate = true;
    // the five charms hang square from evenly spaced points, swinging with the rope
    const lit = this.fill * 5;
    for (let c = 0; c < 5; c++) {
      const i = Math.round(((c + 1) / 6) * (N - 1));
      const q = this.p[i];
      _w.subVectors(this.p[Math.min(N - 1, i + 1)], this.p[Math.max(0, i - 1)]).normalize();
      // the charm's face turned square to the rope, hanging under it
      const side = _v.crossVectors(_w, DOWN);
      if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
      side.normalize();
      const fwd = _s.crossVectors(side, UP).normalize();
      _m.makeBasis(side, UP, fwd);
      _q.setFromRotationMatrix(_m);
      const pos = _w.copy(q).addScaledVector(DOWN, 0.055);
      _m.compose(pos, _q, _s.set(0.07, 0.07, 0.012));
      this.charms.setMatrixAt(c, _m);
      // the charms light one by one as the store fills
      const k = Math.max(0, Math.min(1, lit - c)) * (0.75 + 0.25 * Math.sin(time * 8 + c));
      this.charms.setColorAt(c, col.copy(CHARM).lerp(this.color, k * 0.5));
      if (k > 0.5 && Math.random() < 0.15) this.g.engine.glow.spawn({ x: pos.x, y: pos.y, z: pos.z, size: 0.18, sizeEnd: 0.04, life: 0.3, r: this.color.r, g: this.color.g, b: this.color.b, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
    }
    this.charms.instanceMatrix.needsUpdate = true;
    if (this.charms.instanceColor) this.charms.instanceColor.needsUpdate = true;
    this.charmMat.emissive.copy(this.color);
    this.charmMat.emissiveIntensity = Math.min(2.5, this.fill * 1.2 + this.blaze * 2);
  }

  dispose(): void {
    for (const m of [this.cubes, this.charms]) {
      m.removeFromParent();
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
      m.dispose();
    }
  }
}

/** An attack swallowed by the left blade: a swirl of its colour drawn into the steel, a ring on the blade. */
export function energyCatch(g: Game, at: THREE.Vector3, from: THREE.Vector3, color: THREE.ColorRepresentation, amount: number): void {
  const c = new THREE.Color(color);
  const glow = g.engine.glow;
  const n = Math.min(26, 6 + Math.round(amount / 5));
  _v.subVectors(from, at).normalize();
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r = 0.5 + Math.random() * 0.9;
    const px = at.x + _v.x * r + Math.cos(a) * 0.4, py = at.y + _v.y * r + Math.sin(a) * 0.4, pz = at.z + _v.z * r + Math.sin(a) * 0.3;
    glow.spawn({ x: px, y: py, z: pz, vx: (at.x - px) * 5, vy: (at.y - py) * 5, vz: (at.z - pz) * 5, size: 0.24, sizeEnd: 0.04, life: 0.2, r: c.r, g: c.g, b: c.b, alpha: 1, alphaEnd: 0.2, tex: TEX_STREAK, stretch: 3, drag: 0 });
  }
  glow.spawn({ x: at.x, y: at.y, z: at.z, size: 0.5, sizeEnd: 1.4, life: 0.18, r: c.r, g: c.g, b: c.b, alpha: 0.9, alphaEnd: 0, tex: TEX_RING });
  glow.spawn({ x: at.x, y: at.y, z: at.z, size: 0.7, sizeEnd: 0.1, life: 0.16, r: PULSE.r, g: PULSE.g, b: PULSE.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
}

/** Bakudō #8 Seki: a disc of pale light pushed out of the palm, flashing and gone. */
export class SekiDisc implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.Mesh;
  private rim: THREE.Mesh;

  constructor(private g: Game, private at: THREE.Vector3, private normal: THREE.Vector3) {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#CFE6FF').multiplyScalar(1.4), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 32), mat);
    const rmat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#E8F4FF').multiplyScalar(2), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.rim = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 40), rmat);
    for (const m of [this.mesh, this.rim]) {
      m.position.copy(at);
      m.quaternion.setFromUnitVectors(_v.set(0, 0, 1), normal);
      m.renderOrder = 7;
      m.frustumCulled = false;
      g.engine.gr.scene.add(m);
    }
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const side = _w.set(normal.z, 0, -normal.x).normalize();
      g.engine.glow.spawn({ x: at.x + side.x * Math.cos(a) * 0.4, y: at.y + Math.sin(a) * 0.4, z: at.z + side.z * Math.cos(a) * 0.4, vx: side.x * Math.cos(a) * 4 + normal.x * 3, vy: Math.sin(a) * 4, vz: side.z * Math.cos(a) * 4 + normal.z * 3, size: 0.14, sizeEnd: 0.03, life: 0.3, r: 0.85, g: 0.93, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2.5, drag: 3 });
    }
  }

  update(dt: number): void {
    this.t += dt;
    if (this.t > 0.35) this.done = true;
  }

  render(): void {
    const k = Math.min(1, this.t / 0.08);
    const r = 0.25 + k * 0.6;
    const fade = Math.max(0, 1 - Math.max(0, this.t - 0.12) / 0.23);
    for (const m of [this.mesh, this.rim]) {
      m.scale.setScalar(r);
      m.position.copy(this.at).addScaledVector(this.normal, this.t * 0.8);
    }
    (this.mesh.material as THREE.MeshBasicMaterial).opacity = 0.5 * fade;
    (this.rim.material as THREE.MeshBasicMaterial).opacity = 0.9 * fade;
  }

  dispose(): void {
    for (const m of [this.mesh, this.rim]) {
      m.removeFromParent();
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    }
  }
}
