// Hihiō Zabimaru: a bone snake some thirty metres long, its tail end in Renji's hand. The skull (red mane,
// glinting sockets) is driven by the kit — hovering, sweeping, smashing down, lunging to bite — and the
// vertebrae follow along an arch from the hand up over his shoulder to the skull, spaced along the curve
// by arc length. Moving fast, the skull smashes through whatever it meets and hits whoever it reaches.
// The joints are only reiatsu: single vertebrae can fly free of the arch (`freeW`/`freePos`/`freeDir` —
// Higa Zekkō, the burrowing segments), and after Hikotsu Taihō the whole body is shaken out of line
// (`scatter`).
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { PropMesh, buildCached } from '../game/characterFactory';
import { createCharMaterial } from '../render/charMaterial';
import { renjiProp } from '../chars/renji';
import { SphereShape } from '../destruction/shapes';
import { TEX_PUFF } from './sprites';

export const SNAKE_SEGS = 20;
const SAMPLES = 96;
/** from the skull's origin (the back of the cranium) to the middle of the skull and to the mouth (m) */
export const SKULL_MID = 1.6;
export const SKULL_MOUTH = 3.1;

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const _s = new THREE.Vector3(1, 1, 1);
const Z = new THREE.Vector3(0, 0, 1);

export class BoneSnake implements Projectile {
  done = false;
  /** the skull's origin: the back of the cranium, where the first vertebra joins */
  readonly head = new THREE.Vector3();
  /** where the kit wants the skull */
  readonly headWant = new THREE.Vector3();
  /** how fast the skull chases headWant (1/s) */
  follow = 4;
  /** the skull looks at this when it is not darting about */
  lookAt: THREE.Vector3 | null = null;
  readonly vel = new THREE.Vector3();
  readonly skull: PropMesh;
  /** the mouth (for Hikotsu Taihō): a child of the skull */
  readonly mouth = new THREE.Object3D();
  private body: THREE.InstancedMesh;
  private bodyMat: ReturnType<typeof createCharMaterial>;
  private pts: THREE.Vector3[] = [];
  /** segment joints this frame (for hits) */
  readonly segPos: THREE.Vector3[] = [];
  /** vertebrae flown free of the arch: per-segment blend, position and pointing direction */
  readonly freeW: number[] = new Array<number>(SNAKE_SEGS).fill(0);
  readonly freePos: THREE.Vector3[] = [];
  readonly freeDir: THREE.Vector3[] = [];
  /** shaken out of line (0..1) */
  scatter = 0;
  private jitter: THREE.Vector3[] = [];
  /** red reiatsu glow on the bone (0..1), and its colour */
  glow = 0;
  glowColor: [number, number, number] = [1, 0.3, 0.26];
  /** fighters already hit by the current swing */
  readonly hit = new Set<number>();
  /** damage dealt by a fast-moving skull (0 = harmless) */
  dmg = 0;
  /** knock and launch of those hits */
  knock = 16;
  launch = 6;
  /** a fast skull smashes through the world (off while it merely follows him about) */
  smash = false;
  visible = true;
  private lastSmash = 0;
  private t = 0;
  private prevHead = new THREE.Vector3();
  private look = new THREE.Vector3(0, 0, 1);

  constructor(private g: Game, private owner: Fighter, private anchor: () => THREE.Vector3, start: THREE.Vector3) {
    this.head.copy(start);
    this.headWant.copy(start);
    this.prevHead.copy(start);
    owner.forward(this.look);
    this.skull = new PropMesh(renjiProp('skull'));
    this.skull.castShadow = true;
    this.mouth.position.set(0, -0.25, SKULL_MOUTH);
    this.skull.add(this.mouth);
    const vb = buildCached(renjiProp('vertebra'), false);
    this.bodyMat = createCharMaterial(vb.palette, vb.params, 16);
    this.body = new THREE.InstancedMesh(vb.geometry, this.bodyMat, SNAKE_SEGS);
    this.body.castShadow = true;
    this.body.frustumCulled = false;
    for (let i = 0; i < SAMPLES; i++) this.pts.push(new THREE.Vector3());
    for (let i = 0; i < SNAKE_SEGS; i++) {
      this.segPos.push(new THREE.Vector3());
      this.freePos.push(new THREE.Vector3());
      this.freeDir.push(new THREE.Vector3(0, 0, 1));
      this.jitter.push(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).multiplyScalar(2.6));
    }
    this.skull.position.copy(start);
    this.skull.quaternion.setFromUnitVectors(Z, this.look);
    g.engine.gr.scene.add(this.skull, this.body);
  }

  /** Start a new swing: whoever the skull meets is hit once, for `dmg`. */
  swing(dmg: number, knock = 16, launch = 6): void {
    this.hit.clear();
    this.dmg = dmg;
    this.knock = knock;
    this.launch = launch;
  }

  /** The middle of the skull (world). */
  skullCenter(out = new THREE.Vector3()): THREE.Vector3 {
    return out.copy(this.head).addScaledVector(this.look, SKULL_MID);
  }

  /** Where the skull's origin must be for its mouth to close on p, coming from where it is now. */
  biteAt(p: THREE.Vector3, out = new THREE.Vector3()): THREE.Vector3 {
    const d = _v.subVectors(p, this.head);
    if (d.lengthSq() < 1e-4) d.copy(this.look);
    return out.copy(p).addScaledVector(d.normalize(), -SKULL_MOUTH + 0.4);
  }

  get facing(): THREE.Vector3 {
    return this.look;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    this.prevHead.copy(this.head);
    // the skull chases its target, critically damped
    const k = 1 - Math.exp(-this.follow * dt);
    this.head.lerp(this.headWant, k);
    // a slow living sway
    this.head.y += Math.sin(this.t * 1.7) * 0.02;
    this.vel.subVectors(this.head, this.prevHead).divideScalar(Math.max(1e-4, dt));
    this.scatter = Math.max(0, this.scatter - dt * 0.45);
    const speed = this.vel.length();
    // where the skull looks: along a fast lunge, else at what it was told to watch
    const want = _w;
    if (speed > 7) want.copy(this.vel).normalize();
    else if (this.lookAt) want.subVectors(this.lookAt, this.head).normalize();
    else want.subVectors(this.headWant, this.anchor()).setY(0).normalize();
    if (want.lengthSq() > 0.5) this.look.lerp(want, 1 - Math.exp(-6 * dt)).normalize();
    this.layout();
    // a fast skull smashes through the world and hits fighters
    if (speed > 9 && this.visible) {
      const c = this.skullCenter(new THREE.Vector3());
      if (this.smash && this.t - this.lastSmash > 0.05) {
        this.lastSmash = this.t;
        const p = c.clone().addScaledVector(this.vel, 0.02);
        g.engine.destruction.carve(new SphereShape(p, 2.1, 0.8), { mode: 'smash', power: 140 + speed * 6, impulse: 10 + speed * 0.3, dust: 0.5 });
      }
      if (this.dmg > 0) {
        for (const f of g.enemiesOf(this.owner)) {
          if (this.hit.has(f.id)) continue;
          const fc = f.center();
          let near = fc.distanceTo(c) < 2.3 + f.def.radius || fc.distanceTo(this.head) < 1.8 + f.def.radius;
          // the body sweeps too (every other segment)
          for (let i = 0; i < SNAKE_SEGS && !near; i += 2) if (fc.distanceTo(this.segPos[i]) < 1.2 + f.def.radius) near = true;
          if (!near) continue;
          this.hit.add(f.id);
          const dir = _v.copy(this.vel).setY(0);
          if (dir.lengthSq() < 1e-4) dir.subVectors(f.pos, this.owner.pos).setY(0);
          dir.normalize();
          g.damage(f, this.dmg, this.owner, dir.clone(), { knock: this.knock, launch: this.launch, heavy: true, hitstop: 0.1, shake: 0.5 });
          g.sparks(fc, dir, '#FF6B6B', 18);
        }
      }
    }
  }

  /** Sample the arch from the hand to the skull and place the vertebrae along it by arc length. */
  private layout(): void {
    const a = this.anchor();
    const h = this.head;
    const fw = this.owner.forward(_w);
    const span = a.distanceTo(h);
    // control points: up and back over the shoulder from the hand, then up and round to the skull
    const c1 = new THREE.Vector3().copy(a).add(new THREE.Vector3(0, Math.min(10, 3 + span * 0.35), 0)).addScaledVector(fw, -Math.min(6, 1.5 + span * 0.15));
    const c2 = new THREE.Vector3().copy(h).add(new THREE.Vector3(0, Math.min(9, 2 + span * 0.3), 0)).addScaledVector(this.look, -Math.min(8, 3 + span * 0.2));
    for (let i = 0; i < SAMPLES; i++) {
      const u = i / (SAMPLES - 1), w = 1 - u;
      this.pts[i].set(0, 0, 0).addScaledVector(a, w * w * w).addScaledVector(c1, 3 * w * w * u).addScaledVector(c2, 3 * w * u * u).addScaledVector(h, u * u * u);
    }
    // arc length from the skull back down the body
    let total = 0;
    const lens = [0];
    for (let i = SAMPLES - 1; i > 0; i--) {
      total += this.pts[i].distanceTo(this.pts[i - 1]);
      lens.push(total);
    }
    // the vertebrae always span the whole arch (stretched, the reiatsu joints show as gaps)
    const spacing = total / (SNAKE_SEGS + 0.3);
    let j = 0;
    for (let s = 0; s < SNAKE_SEGS; s++) {
      const want = (s + 0.3) * spacing;
      while (j < lens.length - 2 && lens[j + 1] < want) j++;
      const i0 = SAMPLES - 1 - j, i1 = Math.max(0, i0 - 1);
      const f = Math.min(1, (want - lens[j]) / Math.max(1e-5, lens[j + 1] - lens[j]));
      const p = this.segPos[s].lerpVectors(this.pts[i0], this.pts[i1], f);
      if (this.scatter > 0) p.addScaledVector(this.jitter[s], this.scatter * (0.4 + s / SNAKE_SEGS));
      const fwt = this.freeW[s];
      if (fwt > 0) p.lerp(this.freePos[s], fwt);
    }
  }

  render(): void {
    this.skull.visible = this.visible;
    this.body.visible = this.visible;
    if (!this.visible) return;
    this.skull.position.copy(this.head);
    _q.setFromUnitVectors(Z, this.look);
    this.skull.quaternion.slerp(_q, 0.35);
    const gl = this.glow;
    const [cr, cg, cb] = this.glowColor;
    this.skull.material.userData.uniforms.uFlash.value.set(cr, cg, cb, gl * 0.5);
    this.bodyMat.userData.uniforms.uFlash.value.set(cr, cg, cb, gl * 0.6);
    for (let s = 0; s < SNAKE_SEGS; s++) {
      const p = this.segPos[s];
      const ahead = s === 0 ? this.head : this.segPos[s - 1];
      const d = _w.subVectors(ahead, p);
      if (d.lengthSq() < 1e-6) d.copy(this.look);
      _q.setFromUnitVectors(Z, d.normalize());
      const fw = this.freeW[s];
      if (fw > 0) _q.slerp(_q2.setFromUnitVectors(Z, this.freeDir[s]), fw);
      const sc = 1 - (s / SNAKE_SEGS) * 0.45;
      _s.set(sc, sc, sc);
      _m.compose(p, _q, _s);
      this.body.setMatrixAt(s, _m);
    }
    this.body.instanceMatrix.needsUpdate = true;
  }

  /** A burst of dust where the snake rises or falls apart. */
  dust(p: THREE.Vector3, n = 20, speed = 8): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      this.g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * speed, vy: Math.random() * 4, vz: Math.sin(a) * speed, size: 1, sizeEnd: 3.4, life: 1.2, r: 0.72, g: 0.66, b: 0.58, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 2 });
    }
  }

  dispose(): void {
    this.skull.removeFromParent();
    this.skull.material.dispose();
    this.body.removeFromParent();
    this.bodyMat.dispose();
  }
}
