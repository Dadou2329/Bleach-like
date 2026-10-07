// Hyōrinmaru's chain: a verlet rope hanging from the pommel with the crescent sickle on the end. Idle, it
// swings and trails with every move of the sword; thrown, the crescent flies out and the chain pays out
// behind it, then snaps taut and hauls back. Links are drawn as small alternating steel plates.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import { PropMesh } from '../game/characterFactory';
import { hitsugayaProp } from '../chars/hitsugaya';

const NODES = 18;
const LINKS_PER = 6;

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _d = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const _s = new THREE.Vector3(1, 1, 1);
const Z = new THREE.Vector3(0, 0, 1);

export class SickleChain implements Projectile {
  done = false;
  private p: THREE.Vector3[] = [];
  private prev: THREE.Vector3[] = [];
  private links: THREE.InstancedMesh;
  private mat = new THREE.MeshStandardMaterial({ color: '#9BA4AE', metalness: 0.85, roughness: 0.32 });
  readonly crescent: PropMesh;
  /** rest length of the whole chain (m) — grows while thrown */
  length = 0.62;
  private idleLength = 0.62;
  /** when set, the last node is pinned here (the crescent in flight or hooked into a target) */
  end: THREE.Vector3 | null = null;
  visible = true;

  constructor(private g: Game, private anchor: () => THREE.Vector3) {
    const a = anchor();
    for (let i = 0; i < NODES; i++) {
      const q = a.clone().add(new THREE.Vector3(0, -(i / (NODES - 1)) * this.length, 0));
      this.p.push(q);
      this.prev.push(q.clone());
    }
    const geo = new THREE.BoxGeometry(0.022, 0.01, 0.05);
    this.links = new THREE.InstancedMesh(geo, this.mat, (NODES - 1) * LINKS_PER);
    this.links.frustumCulled = false;
    this.links.castShadow = true;
    this.crescent = new PropMesh(hitsugayaProp('crescent'));
    this.crescent.castShadow = true;
    g.engine.gr.scene.add(this.links, this.crescent);
  }

  /** Where the crescent is now (world). */
  get tip(): THREE.Vector3 {
    return this.p[NODES - 1];
  }

  /** Pay the chain out to `len` metres (thrown) or back to its idle drop. */
  setLength(len: number | null): void {
    this.length = len ?? this.idleLength;
  }

  update(dt: number): void {
    const a = this.anchor();
    const n = NODES;
    // verlet: gravity and a little air drag
    const drag = Math.exp(-1.6 * dt);
    for (let i = 1; i < n; i++) {
      const p = this.p[i], q = this.prev[i];
      _d.subVectors(p, q).multiplyScalar(drag);
      q.copy(p);
      p.add(_d);
      p.y -= 9.8 * dt * dt;
    }
    this.p[0].copy(a);
    this.prev[0].copy(a);
    if (this.end) {
      this.p[n - 1].copy(this.end);
      this.prev[n - 1].copy(this.end);
    }
    const seg = this.length / (n - 1);
    for (let it = 0; it < 8; it++) {
      for (let i = 0; i < n - 1; i++) {
        const p0 = this.p[i], p1 = this.p[i + 1];
        _d.subVectors(p1, p0);
        const l = _d.length() || 1e-6;
        // a chain only resists stretching
        if (l <= seg) continue;
        const k = (l - seg) / l;
        const w0 = i === 0 ? 0 : 0.5, w1 = i + 1 === n - 1 && this.end ? 0 : 0.5;
        const sum = w0 + w1 || 1;
        p0.addScaledVector(_d, (k * w0) / sum);
        p1.addScaledVector(_d, (-k * w1) / sum);
      }
      this.p[0].copy(a);
      if (this.end) this.p[n - 1].copy(this.end);
    }
    // the ground stops it
    const w = this.g.engine.world, vs = w.vs;
    for (let i = 1; i < n; i++) {
      const p = this.p[i];
      if (w.isSolid(Math.floor(p.x / vs), Math.floor(p.y / vs), Math.floor(p.z / vs))) {
        p.y = (Math.floor(p.y / vs) + 1) * vs + 0.01;
        this.prev[i].lerp(p, 0.5);
      }
    }
  }

  render(): void {
    this.links.visible = this.visible;
    this.crescent.visible = this.visible;
    if (!this.visible) return;
    let c = 0;
    for (let i = 0; i < NODES - 1; i++) {
      _a.copy(this.p[i]);
      _b.copy(this.p[i + 1]);
      _d.subVectors(_b, _a);
      const l = _d.length();
      if (l < 1e-5) _d.set(0, -1, 0);
      _d.normalize();
      _q.setFromUnitVectors(Z, _d);
      const per = Math.max(1, Math.min(LINKS_PER, Math.round(l / 0.045)));
      for (let k = 0; k < LINKS_PER; k++) {
        if (k >= per) {
          _m.makeScale(0, 0, 0);
          this.links.setMatrixAt(c++, _m);
          continue;
        }
        // alternate links turned a quarter round the chain's axis
        _q2.setFromAxisAngle(Z, (c % 2) * Math.PI * 0.5);
        const q = _q2.premultiply(_q);
        _m.compose(_a.clone().addScaledVector(_d, (l * (k + 0.5)) / per), q, _s);
        this.links.setMatrixAt(c++, _m);
      }
    }
    this.links.instanceMatrix.needsUpdate = true;
    // the crescent rides the last node, hanging along the last link
    const e = this.p[NODES - 1];
    _d.subVectors(e, this.p[NODES - 2]);
    if (_d.lengthSq() < 1e-8) _d.set(0, -1, 0);
    _d.normalize();
    this.crescent.position.copy(e);
    this.crescent.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _d);
  }

  dispose(): void {
    this.links.removeFromParent();
    this.links.geometry.dispose();
    this.mat.dispose();
    this.crescent.removeFromParent();
    this.crescent.material.dispose();
  }
}
