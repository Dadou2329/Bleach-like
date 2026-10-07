// A long cloth ribbon (Sode no Shirayuki's, from the pommel): a verlet chain pinned at one end, under light
// gravity and drag with a little flutter, drawn as a flat strip that twists slowly along its length. It
// never sinks below the ground its owner stands on.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';

const _a = new THREE.Vector3();
const _t = new THREE.Vector3();
const _s = new THREE.Vector3();
const _u = new THREE.Vector3();

export class Ribbon implements Projectile {
  done = false;
  visible = true;
  private pts: THREE.Vector3[] = [];
  private prev: THREE.Vector3[] = [];
  private seg: number;
  private mesh: THREE.Mesh;
  private pos: Float32Array;
  private t = Math.random() * 10;

  /**
   * @param anchor where the ribbon is tied (world), read every step
   * @param floor  the lowest the ribbon may hang (world y)
   */
  constructor(g: Game, private anchor: () => THREE.Vector3 | null, private floor: () => number, readonly n = 20, readonly length = 3.2, readonly width = 0.075, color: THREE.ColorRepresentation = '#E8EEF3') {
    this.seg = length / (n - 1);
    const a = anchor() ?? new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      this.pts.push(a.clone().add(new THREE.Vector3(0, -i * this.seg, 0)));
      this.prev.push(this.pts[i].clone());
    }
    this.pos = new Float32Array(n * 2 * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    const idx: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
    geo.setIndex(idx);
    this.mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, side: THREE.DoubleSide }));
    this.mesh.castShadow = true;
    this.mesh.frustumCulled = false;
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number): void {
    this.t += dt;
    const a = this.anchor();
    if (!a) return;
    const drag = Math.exp(-2.6 * dt);
    const fy = this.floor() + 0.03;
    const p = this.pts, q = this.prev;
    p[0].copy(a);
    q[0].copy(a);
    for (let i = 1; i < this.n; i++) {
      const v = _a.subVectors(p[i], q[i]).multiplyScalar(drag);
      q[i].copy(p[i]);
      // light gravity (cloth floats) and a flutter that runs down the ribbon
      const ph = this.t * 3.1 - i * 0.45;
      v.x += Math.sin(ph) * 0.0009 * i;
      v.z += Math.cos(ph * 0.8) * 0.0009 * i;
      v.y -= 4.2 * dt * dt;
      p[i].add(v);
    }
    // constraints, a few passes
    for (let it = 0; it < 4; it++) {
      for (let i = 1; i < this.n; i++) {
        const d = _a.subVectors(p[i], p[i - 1]);
        const l = d.length() || 1e-6;
        const diff = (l - this.seg) / l;
        if (i === 1) p[i].addScaledVector(d, -diff);
        else {
          p[i].addScaledVector(d, -diff * 0.5);
          p[i - 1].addScaledVector(d, diff * 0.5);
        }
      }
      p[0].copy(a);
      for (let i = 1; i < this.n; i++) if (p[i].y < fy) p[i].y = fy;
    }
  }

  render(): void {
    this.mesh.visible = this.visible;
    if (!this.visible) return;
    const p = this.pts;
    for (let i = 0; i < this.n; i++) {
      const t = _t.subVectors(p[Math.min(this.n - 1, i + 1)], p[Math.max(0, i - 1)]);
      if (t.lengthSq() < 1e-8) t.set(0, -1, 0);
      t.normalize();
      // the flat side turns slowly along the ribbon
      const tw = i * 0.22 + Math.sin(this.t * 1.3) * 0.6;
      _u.set(Math.cos(tw), 0.2, Math.sin(tw));
      const s = _s.crossVectors(t, _u);
      if (s.lengthSq() < 1e-6) s.set(1, 0, 0);
      s.normalize().multiplyScalar(this.width * (i === this.n - 1 ? 0.6 : 1) * 0.5);
      this.pos.set([p[i].x + s.x, p[i].y + s.y, p[i].z + s.z, p[i].x - s.x, p[i].y - s.y, p[i].z - s.z], i * 6);
    }
    const g = this.mesh.geometry;
    (g.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    g.computeVertexNormals();
    g.computeBoundingSphere();
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
