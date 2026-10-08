// Sōō Zabimaru (TYBW Renji; docs/kits/renji.md). Hihiō: the baboon king's giant arm out of the cowl on his left
// shoulder — a mirror rig that copies his left arm's bone rotations every rendered frame (after his animator has
// posed him), so his clips drive it; it forms out of the fur and dissolves back into it, jets flame from the bone
// disk on its shoulder, and can hold a pose of its own (the palm raised as an umbrella). Hihi Tenshō: fur clumps shed
// round the target, giant hands rising out of them that close on it. Zaga Teppō: a serpent skull of burning reishi
// that lunges over the impaled foe and bites. Zagai Zekkō: the skull swung round overhead on its tail — small at
// first, then swollen into a flaming bone snake with a disc of fire filling its circle — and the thrown disc that
// craters a district.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { CharacterVisual, PropMesh } from '../game/characterFactory';
import { renjiTybwProp } from '../chars/renjiTybw';
import { renjiProp } from '../chars/renji';
import { BoneSnake, SKULL_MOUTH } from './boneSnake';
import { BeadLine } from './shiro';
import { SphereShape } from '../destruction/shapes';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';
import { groundAt } from './iceArts';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const Z = new THREE.Vector3(0, 0, 1);
const UP = new THREE.Vector3(0, 1, 0);

/** Sōō Zabimaru's gold reiatsu */
export const SOO_GOLD = '#F5C542';
const GOLD: [number, number, number] = [1, 0.8, 0.3];
const FIRE: [number, number, number] = [1, 0.52, 0.16];

/** flame licks: `n` sprites out of `p` along `dir` */
export function jetFlame(g: Game, p: THREE.Vector3, dir: THREE.Vector3, n: number, speed = 9, size = 0.45): void {
  for (let i = 0; i < n; i++) {
    const sp = speed * (0.6 + Math.random() * 0.6);
    const j = 0.25;
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: (dir.x + (Math.random() - 0.5) * j) * sp, vy: (dir.y + (Math.random() - 0.5) * j) * sp, vz: (dir.z + (Math.random() - 0.5) * j) * sp, size: size * (0.7 + Math.random() * 0.6), sizeEnd: size * 0.15, life: 0.22 + Math.random() * 0.18, r: FIRE[0], g: FIRE[1] + Math.random() * 0.25, b: FIRE[2], alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 1.5 });
  }
}

/** a burst of fire and embers at p */
export function fireBurst(g: Game, p: THREE.Vector3, n: number, spread: number, up = 3): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, e = Math.random();
    const sp = spread * (0.4 + Math.random());
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * sp, vy: up * e + 1, vz: Math.sin(a) * sp, size: 0.6 + Math.random() * 0.8, sizeEnd: 0.1, life: 0.4 + Math.random() * 0.4, r: FIRE[0], g: FIRE[1] + Math.random() * 0.3, b: FIRE[2], alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 2 });
    if (i % 3 === 0) g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * sp * 0.6, vy: up * e, vz: Math.sin(a) * sp * 0.6, size: 1, sizeEnd: 2.6, life: 1, r: 0.3, g: 0.27, b: 0.25, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 1.6 });
  }
}

/** the bones of his left arm Hihiō copies */
const MIRRORED = ['upperarm.L', 'forearm.L', 'hand.L'];

/**
 * Hihiō on his left shoulder. `want` 1 brings it out (it grows out of the cowl in ~0.15 s), 0 sends it back (~0.35 s);
 * `fist` closes its hand; `boost` (seconds) jets flame from its shoulder disk; `pose` holds bone rotations of its own
 * instead of his. `bare`: the furless skeleton of Two Kings (spectral, orange).
 */
export class HihioArm implements Projectile {
  done = false;
  readonly v: CharacterVisual;
  /** where its shoulder sits (his shoulder frame: x out to his left, y up, z forward), m */
  readonly offset = new THREE.Vector3(0.14, 0.32, -0.1);
  want = 0;
  private k = 0;
  fist = false;
  boost = 0;
  pose: Map<string, THREE.Quaternion> | null = null;
  private map: Int16Array;
  private mine: Int16Array;
  private t = 0;
  /** the fist's travel this frame (world) for strikes */
  readonly fistPos = new THREE.Vector3();
  readonly prevFist = new THREE.Vector3();

  constructor(private g: Game, readonly owner: Fighter, readonly bare = false) {
    this.v = new CharacterVisual(renjiTybwProp(bare ? 'hihio-bare' : 'hihio'), [], []);
    const src = owner.visual.rig, dst = this.v.rig;
    this.map = new Int16Array(MIRRORED.length);
    this.mine = new Int16Array(MIRRORED.length);
    MIRRORED.forEach((n, i) => {
      this.map[i] = src.index(n);
      this.mine[i] = dst.index(n);
    });
    this.v.object.visible = false;
    this.setDissolve(1);
    g.engine.gr.scene.add(this.v.object);
  }

  /** how much of it is there (0..1) */
  get presence(): number {
    return this.k;
  }

  private setDissolve(k: number): void {
    this.v.forEachMaterial((m) => (m.userData.uniforms.uDissolve.value = k));
  }

  update(dt: number): void {
    this.t += dt;
    if (this.owner.dead) this.want = 0;
    const rate = this.want > this.k ? 7 : 3;
    this.k += Math.sign(this.want - this.k) * Math.min(Math.abs(this.want - this.k), rate * dt);
    this.boost = Math.max(0, this.boost - dt);
  }

  render(dt: number): void {
    const show = this.k > 0.01;
    this.v.object.visible = show;
    if (!show) return;
    const f = this.owner;
    const src = f.visual.rig, dst = this.v.rig;
    // its pose: his left arm's rotations, or its own
    MIRRORED.forEach((n, i) => {
      const di = this.mine[i];
      if (di < 0) return;
      const own = this.pose?.get(n);
      if (own) dst.bones[di].quaternion.slerp(own, 1 - Math.exp(-14 * dt));
      else if (this.map[i] >= 0) dst.bones[di].quaternion.copy(src.bones[this.map[i]].quaternion);
    });
    dst.setBoneVisible('palm.L', !this.fist);
    dst.setBoneVisible('fist.L', this.fist);
    // its shoulder at his, raised and out, turned with his shoulder
    const sh = src.bones[src.index('shoulder.L')];
    const ua = src.bones[src.index('upperarm.L')];
    sh.getWorldQuaternion(_q);
    ua.getWorldPosition(_v);
    const o = this.v.object;
    o.quaternion.copy(_q);
    o.position.copy(_v).add(_w.copy(this.offset).applyQuaternion(_q));
    o.scale.setScalar(0.35 + 0.65 * this.k);
    o.updateMatrixWorld(true);
    this.setDissolve(1 - this.k);
    const rimK = this.bare ? 0.9 : 0.35 + this.boost * 2;
    this.v.forEachMaterial((m) => {
      const u = m.userData.uniforms;
      if (this.bare) u.uRim.value.set(1, 0.55, 0.2, rimK);
      else u.uRim.value.set(GOLD[0], GOLD[1], GOLD[2], Math.min(1, rimK));
    });
    this.prevFist.copy(this.fistPos);
    this.point(this.fist ? 'fist' : 'palm', this.fistPos);
    // the jet: flame out of the disk, back along the punch
    if (this.boost > 0 && !this.bare) {
      const nz = this.point('nozzle', _w);
      const back = _v.subVectors(nz, this.fistPos).normalize();
      jetFlame(this.g, nz, back.lerp(UP, 0.3).normalize(), 6, 10, 0.55);
    }
    // a little fur shed while it forms
    if (this.want > 0 && this.k < 0.9 && !this.bare) {
      const p = this.point('upperarm.L', _w);
      this.g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: (Math.random() - 0.5) * 3, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 3, size: 0.25, sizeEnd: 0.05, life: 0.5, r: 0.42, g: 0.62, b: 0.48, alpha: 0.8, alphaEnd: 0, tex: TEX_PUFF, drag: 1.5 });
    }
  }

  /** world position of one of its sockets ('fist', 'palm', 'nozzle') or bones */
  point(name: string, out = new THREE.Vector3()): THREE.Vector3 {
    const s = this.v.rig.sockets.get(name);
    if (s) return s.getWorldPosition(out);
    const i = this.v.rig.index(name);
    if (i >= 0) return this.v.rig.bones[i].getWorldPosition(out);
    return out.copy(this.v.object.position);
  }

  /** the socket object (for a beam's emitter) */
  socket(name: string): THREE.Object3D {
    return this.v.rig.sockets.get(name) ?? this.v.object;
  }

  dispose(): void {
    this.v.object.removeFromParent();
  }
}

// ------------------------------------------------------------------ Hihi Tenshō

/**
 * Hihi Tenshō: fur clumps shed from the cowl arc out and land round the target (r 2.4); out of each a giant hand rises
 * and reaches for it; when they close the target is held (rooted, `dps` crushing) for `hold` seconds — if it is still
 * inside the ring. `held` tells the kit whether it caught.
 */
export class HihiTensho implements Projectile {
  done = false;
  held = false;
  private t = 0;
  private clumps: PropMesh[] = [];
  private hands: PropMesh[] = [];
  private fists: PropMesh[] = [];
  private spots: THREE.Vector3[] = [];
  private from: THREE.Vector3;
  private center: THREE.Vector3;
  private closed = false;
  private endT = -1;

  constructor(private g: Game, readonly owner: Fighter, readonly target: Fighter, readonly o = { hold: 3.5, dps: 25, n: 4 }) {
    this.from = owner.center().add(new THREE.Vector3(0, 0.5, 0));
    this.center = target.pos.clone();
    const a0 = Math.atan2(owner.pos.x - target.pos.x, owner.pos.z - target.pos.z) + Math.PI / o.n;
    for (let i = 0; i < o.n; i++) {
      const a = a0 + (i / o.n) * Math.PI * 2;
      const p = new THREE.Vector3(this.center.x + Math.sin(a) * 2.4, this.center.y, this.center.z + Math.cos(a) * 2.4);
      p.y = groundAt(g, p.x, p.y + 2, p.z, 6) ?? p.y;
      this.spots.push(p);
      const c = new PropMesh(renjiTybwProp('fur-clump'));
      c.scale.setScalar(0.7);
      c.visible = false;
      const h = new PropMesh(renjiTybwProp('hand-open'));
      h.matrixAutoUpdate = false;
      h.visible = false;
      const fz = new PropMesh(renjiTybwProp('hand-fist'));
      fz.matrixAutoUpdate = false;
      fz.visible = false;
      g.engine.gr.scene.add(c, h, fz);
      this.clumps.push(c);
      this.hands.push(h);
      this.fists.push(fz);
    }
    g.sfx.play('roar', this.from, 0.5);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const t = this.t, tgt = this.target;
    // the hands close at 0.55: whoever is still inside is caught
    if (!this.closed && t >= 0.55) {
      this.closed = true;
      const d = Math.hypot(tgt.pos.x - this.center.x, tgt.pos.z - this.center.z);
      this.held = !tgt.dead && d < 2.9 && Math.abs(tgt.pos.y - this.center.y) < 3;
      for (let i = 0; i < this.hands.length; i++) {
        this.hands[i].visible = false;
        this.fists[i].visible = true;
      }
      if (this.held) {
        g.damage(tgt, 30, this.owner, _v.subVectors(tgt.pos, this.owner.pos).setY(0).normalize().clone(), { knock: 0, hitstop: 0.12, shake: 0.4, heavy: true });
        g.callout('', 'HELD', '#9CC3A3');
      }
      g.sfx.play('impact', this.center, 1);
    }
    if (this.closed && this.held && !tgt.dead && this.endT < 0) {
      // held fast in the middle of the hands, crushed
      tgt.body.pos.x = this.center.x;
      tgt.body.pos.z = this.center.z;
      tgt.body.vel.set(0, 0, 0);
      tgt.push.set(0, 0, 0);
      tgt.hitstun = Math.max(tgt.hitstun, 0.2);
      tgt.rooted = true;
      g.drain(tgt, this.o.dps * dt, this.owner);
    }
    const holdEnd = 0.55 + (this.held ? this.o.hold : 0.35);
    if (this.endT < 0 && (t >= holdEnd || this.owner.dead)) {
      this.endT = t;
      if (this.held) tgt.rooted = false;
      for (const s of this.spots) {
        for (let i = 0; i < 8; i++) g.engine.dust.spawn({ x: s.x, y: s.y + 1 + Math.random() * 1.5, z: s.z, vx: (Math.random() - 0.5) * 4, vy: Math.random() * 3, vz: (Math.random() - 0.5) * 4, size: 0.6, sizeEnd: 1.6, life: 0.8, r: 0.42, g: 0.6, b: 0.46, alpha: 0.6, alphaEnd: 0, tex: TEX_PUFF, drag: 1.5 });
      }
    }
    if (this.endT >= 0 && t - this.endT > 0.45) this.done = true;
  }

  /** release early (the kit's throw, or the target broke loose) */
  release(): void {
    if (this.endT < 0) this.endT = this.t;
    if (this.held) this.target.rooted = false;
  }

  render(): void {
    const t = this.t;
    const out = this.endT >= 0 ? Math.min(1, (t - this.endT) / 0.4) : 0;
    for (let i = 0; i < this.spots.length; i++) {
      const s = this.spots[i];
      // the clump flies out of the cowl to its spot in an arc, then sits
      const c = this.clumps[i];
      const fl = Math.min(1, t / 0.28);
      c.visible = out < 1;
      c.position.lerpVectors(this.from, s, fl);
      c.position.y += Math.sin(fl * Math.PI) * 2.5;
      c.scale.setScalar(0.7 * (1 - out));
      c.rotation.y = i * 1.3 + fl * 3;
      // the hand: rises out of the clump, leaning in toward the target, palm toward it
      const rise = THREE.MathUtils.smoothstep(t, 0.26, 0.5) * (1 - out);
      const h = this.closed ? this.fists[i] : this.hands[i];
      h.visible = rise > 0.02;
      if (!h.visible) continue;
      const aimAt = _v.copy(this.center).setY(this.center.y + (this.closed ? 1.1 : 1.6));
      const u = _w.subVectors(aimAt, s).normalize().lerp(UP, this.closed ? 0.15 : 0.35).normalize();
      const palm = new THREE.Vector3(this.center.x - s.x, 0, this.center.z - s.z).normalize();
      palm.addScaledVector(u, -palm.dot(u)).normalize();
      // the model's hand points down −Y with its palm toward −X: −Y → u, −X → palm
      const yAxis = u.clone().negate();
      const xAxis = palm.clone().negate();
      const zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();
      xAxis.crossVectors(yAxis, zAxis).normalize();
      const sc = 0.8;
      const origin = s.clone().addScaledVector(u, -2.3 * sc * (1 - rise));
      _m.makeBasis(xAxis.multiplyScalar(sc), yAxis.multiplyScalar(sc), zAxis.multiplyScalar(sc)).setPosition(origin);
      h.matrix.copy(_m);
      h.matrixWorldNeedsUpdate = true;
    }
  }

  dispose(): void {
    for (const m of [...this.clumps, ...this.hands, ...this.fists]) {
      m.removeFromParent();
      m.material.dispose();
    }
  }
}

// ------------------------------------------------------------------ Zaga Teppō

/**
 * The serpent skull of burning reishi: it forms behind the impaled foe on the blade's line and lunges over them, jaws
 * closing (`bite` after 0.3 s: `onBite` does the damage), then burns out.
 */
export class ZagaSkull implements Projectile {
  done = false;
  private t = 0;
  private mesh: PropMesh;
  private bitten = false;

  constructor(private g: Game, readonly owner: Fighter, readonly target: Fighter, readonly dir: THREE.Vector3, private onBite: () => void) {
    this.mesh = new PropMesh(renjiProp('skull-flame'));
    this.mesh.castShadow = false;
    this.mesh.material.userData.uniforms.uDissolve.value = 0.6;
    g.engine.gr.scene.add(this.mesh);
    g.sfx.play('roarBig', target.center(), 0.9);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const c = this.target.center();
    if (!this.bitten && this.t >= 0.3) {
      this.bitten = true;
      this.onBite();
      fireBurst(g, c, 50, 7, 5);
      g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, size: 2, sizeEnd: 9, life: 0.4, r: 1, g: 0.7, b: 0.3, alpha: 0.95, alphaEnd: 0, tex: TEX_GLOW });
      g.addRing(c.clone(), 9, '#FF8A2A', 0.5);
      g.sfx.play('explode', c, 1.4);
    }
    // flames lick off it the whole time
    if (Math.random() < 0.8) {
      const p = this.mesh.position;
      g.engine.glow.spawn({ x: p.x + (Math.random() - 0.5) * 3, y: p.y + (Math.random() - 0.2) * 2.5, z: p.z + (Math.random() - 0.5) * 3, vx: 0, vy: 2 + Math.random() * 2, vz: 0, size: 0.6, sizeEnd: 0.1, life: 0.4, r: FIRE[0], g: FIRE[1], b: FIRE[2], alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
    if (this.t > 0.95) this.done = true;
  }

  render(): void {
    const t = this.t;
    const c = this.target.center(_v);
    const d = this.dir;
    // forming behind, lunging forward until the mouth closes on the target, then burning out
    const lunge = THREE.MathUtils.smoothstep(t, 0, 0.3);
    const s = 0.55 + 0.5 * lunge;
    const back = (SKULL_MOUTH - 0.3) * s + (1 - lunge) * 3;
    this.mesh.position.copy(c).addScaledVector(d, -back).setY(c.y - 0.6 * s);
    this.mesh.quaternion.setFromUnitVectors(Z, d);
    this.mesh.scale.setScalar(s);
    const fade = t < 0.12 ? 1 - t / 0.12 : t > 0.5 ? Math.min(1, (t - 0.5) / 0.45) : 0;
    this.mesh.material.userData.uniforms.uDissolve.value = fade;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.material.dispose();
  }
}

// ------------------------------------------------------------------ Zagai Zekkō

const DISC_FRAG = /* glsl */ `
uniform float uTime; uniform float uA;
varying vec2 vUv;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  if (r > 1.0) discard;
  float a = atan(p.y, p.x);
  float n = 0.5 + 0.5 * sin(a * 14.0 - uTime * 11.0 + r * 9.0) * sin(a * 5.0 + uTime * 4.0);
  float ring = smoothstep(1.0, 0.9, r) * (0.25 + 0.75 * smoothstep(0.35, 0.92, r));
  vec3 col = mix(vec3(1.0, 0.48, 0.12), vec3(1.0, 0.86, 0.45), smoothstep(0.8, 0.97, r));
  gl_FragColor = vec4(col * (1.2 + n * 0.9), uA * ring * (0.55 + 0.45 * n));
}`;
const DISC_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

function discMesh(): THREE.Mesh<THREE.CircleGeometry, THREE.ShaderMaterial> {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(1, 64),
    new THREE.ShaderMaterial({ vertexShader: DISC_VERT, fragmentShader: DISC_FRAG, uniforms: { uTime: { value: 0 }, uA: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
  );
  m.frustumCulled = false;
  m.renderOrder = 6;
  return m;
}

/**
 * The charge: the gauntlet's skull on the end of the tail, whirled overhead from Hihiō's raised hand (`anchor`). For
 * the first seconds a small skull on a whipping tail; past SWELL seconds it swells into a flaming bone snake, and a disc
 * of fire fills the circle it sweeps, growing with the charge. `charge` counts seconds (full at 20).
 */
export class ZagaiCharge implements Projectile {
  static readonly SWELL = 3;
  static readonly FULL = 20;
  done = false;
  charge = 0;
  private a = 0;
  private small: PropMesh;
  private tail: BeadLine;
  private snake: BoneSnake | null = null;
  private disc = discMesh();
  readonly center = new THREE.Vector3();
  readonly head = new THREE.Vector3();

  constructor(private g: Game, readonly owner: Fighter, private anchor: () => THREE.Vector3) {
    this.small = new PropMesh(renjiProp('skull-flame'));
    this.small.scale.setScalar(0.28);
    this.tail = new BeadLine(g, renjiTybwProp('tail-vert'), 0.11, 120);
    this.tail.flash(1, 0.55, 0.2, 0.5);
    g.engine.gr.scene.add(this.small, this.disc);
    this.head.copy(anchor());
  }

  /** the radius the head sweeps now (m) */
  get radius(): number {
    return this.charge < ZagaiCharge.SWELL ? 2.4 + this.charge * 0.5 : Math.min(11, 4 + (this.charge - ZagaiCharge.SWELL) * 0.45);
  }

  update(dt: number, g: Game): void {
    this.charge += dt;
    const swollen = this.charge >= ZagaiCharge.SWELL;
    const w = swollen ? 3.2 : 7;
    this.a += w * dt;
    const an = this.anchor();
    this.center.copy(an).setY(an.y + (swollen ? 2.4 + this.radius * 0.15 : 0.6));
    const r = this.radius;
    this.head.set(this.center.x + Math.cos(this.a) * r, this.center.y + Math.sin(this.a * 2) * 0.4, this.center.z + Math.sin(this.a) * r);
    if (swollen && !this.snake) {
      // it swells: the bone snake bursts out of the little skull in a flash of fire
      const s = new BoneSnake(g, this.owner, this.anchor, this.head.clone());
      s.follow = 9;
      s.glow = 1;
      s.glowColor = [1, 0.5, 0.15];
      this.snake = s;
      g.addProjectile(s);
      this.small.visible = false;
      this.tail.hide();
      fireBurst(g, this.head, 40, 8, 4);
      g.shake(0.4);
      g.sfx.play('roarBig', this.head, 1);
    }
    if (this.snake) {
      this.snake.headWant.copy(this.head);
      this.snake.lookAt = _v.set(this.center.x - Math.sin(this.a) * r * 2, this.head.y, this.center.z + Math.cos(this.a) * r * 2).clone();
      this.snake.glow = 0.7 + 0.3 * Math.sin(this.charge * 6);
      if (Math.random() < 0.5) {
        const p = this.snake.skullCenter(_w);
        jetFlame(g, p, UP, 2, 3, 0.9);
      }
    }
    // the gale off the whirl
    if (Math.random() < 0.3) {
      const a = Math.random() * Math.PI * 2;
      g.engine.dust.spawn({ x: this.center.x + Math.cos(a) * r, y: this.owner.pos.y + 0.2, z: this.center.z + Math.sin(a) * r, vx: -Math.sin(a) * 6, vy: 1, vz: Math.cos(a) * 6, size: 0.8, sizeEnd: 2.4, life: 0.8, r: 0.6, g: 0.55, b: 0.5, alpha: 0.35, alphaEnd: 0, tex: TEX_PUFF, drag: 1.2 });
    }
  }

  render(dt: number): void {
    const swollen = !!this.snake;
    if (!swollen) {
      this.small.position.copy(this.head);
      _v.set(-Math.sin(this.a), 0, Math.cos(this.a));
      this.small.quaternion.setFromUnitVectors(Z, _v);
      this.tail.update(this.anchor(), this.head, 0.2, this.charge);
    }
    const r = this.radius;
    this.disc.position.copy(this.center);
    this.disc.rotation.set(-Math.PI / 2, 0, this.a);
    this.disc.scale.setScalar(r + (swollen ? 2.5 : 0.6));
    const u = this.disc.material.uniforms;
    u.uTime.value += dt;
    u.uA.value = swollen ? Math.min(0.9, 0.3 + (this.charge - ZagaiCharge.SWELL) / 10) : Math.min(0.25, this.charge * 0.1);
  }

  /** end the charge without a throw (interrupted): the snake falls apart */
  collapse(): void {
    if (this.snake) {
      this.snake.dust(this.snake.head.clone(), 30, 10);
      this.snake.done = true;
    }
    this.done = true;
  }

  /** hand the whirl over to the thrown disc */
  release(): { center: THREE.Vector3; radius: number; charge: number } {
    if (this.snake) this.snake.done = true;
    this.done = true;
    return { center: this.center.clone(), radius: this.radius, charge: this.charge };
  }

  dispose(): void {
    this.small.removeFromParent();
    this.small.material.dispose();
    this.tail.dispose();
    this.disc.removeFromParent();
    this.disc.geometry.dispose();
    this.disc.material.dispose();
  }
}

/**
 * The thrown disc: a spinning wheel of fire with the burning skull at its heart, flying at 40 m/s; it detonates on a
 * fighter, on the world, or where it was aimed. `onBlast(at, radius)` does the damage.
 */
export class ZagaiDisc implements Projectile {
  done = false;
  private t = 0;
  private pos: THREE.Vector3;
  private dir: THREE.Vector3;
  private disc = discMesh();
  private skull: PropMesh;
  private range: number;
  private travelled = 0;
  private spin = 0;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, to: THREE.Vector3, readonly size: number, readonly blast: number, private onBlast: (at: THREE.Vector3, radius: number) => void) {
    this.pos = from.clone();
    this.dir = new THREE.Vector3().subVectors(to, from);
    this.range = Math.max(4, this.dir.length() + 2);
    this.dir.normalize();
    this.skull = new PropMesh(renjiProp('skull-flame'));
    this.skull.scale.setScalar(Math.min(1.2, 0.5 + size * 0.06));
    g.engine.gr.scene.add(this.disc, this.skull);
    g.sfx.play('getsugaBlack', from, 1);
  }

  update(dt: number, g: Game): void {
    if (this.done) return;
    this.t += dt;
    const step = 40 * dt;
    this.pos.addScaledVector(this.dir, step);
    this.travelled += step;
    let hit = this.travelled >= this.range;
    for (const f of g.enemiesOf(this.owner)) if (!f.dead && f.center(_v).distanceTo(this.pos) < Math.max(2, this.size * 0.3)) hit = true;
    if (this.travelled > 3 && g.engine.world.isSolidAtPos(this.pos.x, this.pos.y, this.pos.z)) hit = true;
    if (!hit && Math.random() < 0.9) jetFlame(g, this.pos, this.dir.clone().negate(), 3, 6, 1.2);
    if (hit) this.explode(g);
  }

  private explode(g: Game): void {
    this.done = true;
    const p = this.pos.clone();
    const R = this.blast;
    g.engine.destruction.carve(new SphereShape(p, R, 0.7), { mode: 'explode', power: 2600, sparks: [1, 0.6, 0.2], dust: 0.9 });
    if (R > 7) g.engine.destruction.carve(new SphereShape(p.clone().setY(p.y - R * 0.35), R * 0.8, 0.6), { mode: 'explode', power: 2200, dust: 0.7 });
    this.onBlast(p, R);
    fireBurst(g, p, 120, R * 1.4, R * 0.8);
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: R * 0.6, sizeEnd: R * 2.6, life: 0.6, r: 1, g: 0.72, b: 0.32, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    for (let i = 0; i < 3; i++) g.addRing(p.clone().setY(p.y - 0.5 + i * 0.8), R * (1.6 + i * 0.5), i ? '#FFD36B' : '#FF9A2E', 0.6 + i * 0.15);
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * R * 3, vy: Math.random() * R, vz: Math.sin(a) * R * 3, size: 0.4, sizeEnd: 0.05, life: 0.7, r: 1, g: 0.75, b: 0.35, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 1.5 });
    }
    g.shake(Math.min(1.6, 0.6 + R * 0.06));
    g.hitstop(0.12);
    g.sfx.play('explode', p, 2);
  }

  render(dt: number): void {
    this.spin += dt * 9;
    const d = this.dir;
    // the disc flies flat-ish, tilted along its path; the skull at its heart leads
    this.disc.position.copy(this.pos);
    _q.setFromUnitVectors(Z, UP);
    this.disc.quaternion.copy(_q).multiply(new THREE.Quaternion().setFromAxisAngle(Z, this.spin));
    this.disc.scale.setScalar(this.size);
    const u = this.disc.material.uniforms;
    u.uTime.value += dt;
    u.uA.value = 0.9;
    this.skull.position.copy(this.pos).addScaledVector(d, -SKULL_MOUTH * this.skull.scale.x * 0.5);
    this.skull.quaternion.setFromUnitVectors(Z, d);
  }

  dispose(): void {
    this.disc.removeFromParent();
    this.disc.geometry.dispose();
    this.disc.material.dispose();
    this.skull.removeFromParent();
    this.skull.material.dispose();
  }
}
