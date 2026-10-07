// Zabimaru's Shikai: six blade segments strung on a thread. Assembled, they ride the hilt as one jagged
// blade; lashed out, they spread along a curving path toward a point — gaps opening between them, the
// red thread showing — then snap back together. `ext` (0 → 1) drives the lash; `bend` curls the path to
// the side (blind-angle strikes); `wave` adds a travelling ripple. While `sweep` is set the lash cuts like
// a blade along its whole length (fighters and the world). `wrap` coils the segments round a point (the
// constriction); `freeW`/`freePos`/`freeDir` fly single segments off the thread (Higa Zekkō). Stretched out,
// the blade grows more segments along the thread (as in the manga): instanced copies fill the gaps between
// the six real ones, so a twenty-metre lash still reads as a jagged chain of blades.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { BladeSpec, Fighter } from '../game/fighter';
import { PropMesh, buildCached } from '../game/characterFactory';
import { createCharMaterial } from '../render/charMaterial';
import { SwordTrail } from './trail';
import { renjiProp, SEGMENT_BASE, SEGMENT_LEN, type RenjiProp } from '../chars/renji';

const N = SEGMENT_LEN.length;
const TOTAL = SEGMENT_LEN.reduce((a, b) => a + b, 0);
/** extra segments strung along a long lash, one every FILL_GAP metres of path */
const FILL_MAX = 90;
const FILL_GAP = 0.34;
/** the whip's spans swept like blades: joints 0→2, 2→4, 4→6 */
const SPANS: [number, number][] = [[0, 2], [2, 4], [4, 6]];

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _d = new THREE.Vector3();
const _x = new THREE.Vector3();
const _y = new THREE.Vector3();
const _z = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _q3 = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _t = new THREE.Vector3();

export class SegmentedWhip implements Projectile {
  done = false;
  /** 0 = assembled blade, 1 = lashed all the way to `target` */
  ext = 0;
  /** where a full lash reaches (world) */
  readonly target = new THREE.Vector3();
  /** sideways curl of the path (blind-angle lashes), in path lengths; + curls to the hilt's left */
  bend = 0;
  /** ripple amplitude (m) */
  wave = 0;
  visible = true;
  /** while set, every span of the whip sweeps like a blade: it hits fighters and slices the world */
  sweep: BladeSpec | null = null;
  /** 0 = on the lash path, 1 = coiled round `wrapAt` */
  wrap = 0;
  readonly wrapAt = new THREE.Vector3();
  wrapR = 0.7;
  /** segments flown free of the thread: per-segment blend, position and pointing direction */
  readonly freeW: number[] = new Array<number>(N).fill(0);
  readonly freePos: THREE.Vector3[] = [];
  readonly freeDir: THREE.Vector3[] = [];
  /** red reiatsu glow on the blade (0..1) */
  glow = 0;
  readonly segs: PropMesh[] = [];
  /** world centre of each segment this frame (for hits) */
  readonly segPos: THREE.Vector3[] = [];
  /** the joints: the hilt end, then the far end of each segment */
  readonly pts: THREE.Vector3[] = [];
  private prevPts: THREE.Vector3[] = [];
  private hadPts = false;
  readonly tip = new THREE.Vector3();
  readonly prevTip = new THREE.Vector3();
  readonly trail: SwordTrail;
  private thread: THREE.Line;
  private threadPos: Float32Array;
  private fill: THREE.InstancedMesh;
  private fillMat: ReturnType<typeof createCharMaterial>;
  private t = 0;

  constructor(private g: Game, private owner: Fighter, private hilt: () => THREE.Object3D | null) {
    for (let i = 0; i < N; i++) {
      const m = new PropMesh(renjiProp(`seg${i}` as RenjiProp));
      m.castShadow = true;
      g.engine.gr.scene.add(m);
      this.segs.push(m);
      this.segPos.push(new THREE.Vector3());
      this.freePos.push(new THREE.Vector3());
      this.freeDir.push(new THREE.Vector3(0, 0, 1));
    }
    for (let i = 0; i <= N; i++) {
      this.pts.push(new THREE.Vector3());
      this.prevPts.push(new THREE.Vector3());
    }
    this.threadPos = new Float32Array((N + 1) * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.threadPos, 3));
    this.thread = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#FF6B6B', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.thread.frustumCulled = false;
    this.trail = new SwordTrail(24, '#FF6B6B', '#FFD1D1');
    const fb = buildCached(renjiProp('seg3'), false);
    this.fillMat = createCharMaterial(fb.palette, fb.params, 48);
    this.fill = new THREE.InstancedMesh(fb.geometry, this.fillMat, FILL_MAX);
    this.fill.count = 0;
    this.fill.castShadow = true;
    this.fill.frustumCulled = false;
    g.engine.gr.scene.add(this.thread, this.trail.mesh, this.fill);
  }

  update(dt: number): void {
    this.t += dt;
  }

  /** Lay the segments out (called every rendered frame); sweeps the spans when cutting. */
  render(dt: number): void {
    const h = this.hilt();
    const show = this.visible && !!h;
    for (const s of this.segs) s.visible = show;
    let maxFree = 0;
    for (const w of this.freeW) maxFree = Math.max(maxFree, w);
    this.thread.visible = show && (this.ext > 0.08 || this.wrap > 0.05) && maxFree < 0.3;
    if (!h || !show) {
      this.fill.count = 0;
      this.hadPts = false;
      this.trail.emitting = false;
      this.trail.update(dt, this.tip, this.tip);
      return;
    }
    h.updateMatrixWorld(true);
    const hm = h.matrixWorld;
    // the hilt frame: origin, blade axis (+Z), edge (−Y)
    const B = _a.set(0, 0, SEGMENT_BASE).applyMatrix4(hm);
    const hz = _z.set(0, 0, 1).transformDirection(hm);
    const hy = _y.set(0, 1, 0).transformDirection(hm);
    _q.setFromRotationMatrix(_m.extractRotation(hm));
    const e = THREE.MathUtils.smoothstep(this.ext, 0, 1);
    // the lash direction swings from the blade axis toward the target as the whip goes out
    const toT = _b.subVectors(this.target, B);
    const dist = Math.max(TOTAL, toT.length());
    toT.normalize();
    const turn = THREE.MathUtils.smoothstep(this.ext, 0, 0.35);
    const dir = _c.copy(hz).lerp(toT, turn).normalize();
    const reach = TOTAL + (dist - TOTAL) * e;
    const T = _d.copy(B).addScaledVector(dir, reach);
    // the path: a quadratic arc, curled sideways by `bend` and lifted a little at the middle
    const side = _x.crossVectors(dir, hy);
    if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
    side.normalize();
    const C = new THREE.Vector3().addVectors(B, T).multiplyScalar(0.5).addScaledVector(side, -this.bend * reach * 0.5).addScaledVector(hy, reach * 0.06 * e);
    const at = (u: number, out: THREE.Vector3) => {
      const a = (1 - u) * (1 - u), b2 = 2 * (1 - u) * u, c = u * u;
      out.set(B.x * a + C.x * b2 + T.x * c, B.y * a + C.y * b2 + T.y * c, B.z * a + C.z * b2 + T.z * c);
      // a ripple travelling out along the lash
      if (this.wave > 0) out.addScaledVector(side, Math.sin(u * 9 - this.t * 22) * this.wave * u * (1 - u) * 4);
      return out;
    };
    // the coil: a descending spiral round wrapAt, starting on the side that faces the hilt
    const a0 = Math.atan2(B.z - this.wrapAt.z, B.x - this.wrapAt.x);
    let cum = 0;
    const p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), tan = new THREE.Vector3();
    this.pts[0].copy(B);
    this.threadPos[0] = B.x;
    this.threadPos[1] = B.y;
    this.threadPos[2] = B.z;
    const glow = this.glow;
    for (let i = 0; i < N; i++) {
      const len = SEGMENT_LEN[i];
      const u0 = cum / TOTAL, u1 = (cum + len) / TOTAL;
      cum += len;
      at(u0, p0);
      at(u1, p1);
      tan.subVectors(p1, p0);
      // assembled: the segment sits at its place on the blade, in the hilt's frame
      const pos = _p.set(0, 0, SEGMENT_BASE + u0 * TOTAL).applyMatrix4(hm).lerp(p0, e);
      // spread out, the segments keep their length but leave gaps: placed at their arc start, aimed along the arc
      if (tan.lengthSq() < 1e-8) tan.copy(hz);
      tan.normalize();
      _q2.setFromUnitVectors(hz, tan).multiply(_q);
      const q = _q3.copy(_q).slerp(_q2, e);
      if (this.wrap > 0) {
        const ang = a0 + i * 1.12;
        const wp = _t.set(Math.cos(ang) * this.wrapR, 0.42 - i * 0.17, Math.sin(ang) * this.wrapR).add(this.wrapAt);
        const wt = new THREE.Vector3(-Math.sin(ang), -0.12, Math.cos(ang)).normalize();
        pos.lerp(wp, this.wrap);
        q.slerp(_q2.setFromUnitVectors(hz, wt).multiply(_q), this.wrap);
        tan.lerp(wt, this.wrap).normalize();
      }
      const fw = this.freeW[i];
      if (fw > 0) {
        pos.lerp(this.freePos[i], fw);
        const fd = this.freeDir[i];
        q.slerp(_q2.setFromUnitVectors(hz, fd).multiply(_q), fw);
        tan.lerp(fd, fw).normalize();
      }
      const m = this.segs[i];
      m.position.copy(pos);
      m.quaternion.copy(q);
      // flung out, the blades are drawn a little larger so the lash reads at range
      m.scale.setScalar(1 + 0.45 * e * (1 - this.wrap) * (1 - fw));
      this.segPos[i].copy(pos).addScaledVector(tan, len * 0.5);
      this.pts[i + 1].copy(pos).addScaledVector(tan, len);
      this.threadPos[(i + 1) * 3] = this.segPos[i].x;
      this.threadPos[(i + 1) * 3 + 1] = this.segPos[i].y;
      this.threadPos[(i + 1) * 3 + 2] = this.segPos[i].z;
      m.material.userData.uniforms.uFlash.value.set(1, 0.3, 0.26, glow * 0.6);
    }
    this.prevTip.copy(this.tip);
    this.tip.copy(this.pts[N]);
    this.layFill(at, hz, e, maxFree);
    (this.thread.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    // the lash sweeps like a blade, span by span
    if (this.sweep && this.hadPts) {
      for (const [i, j] of SPANS) this.g.bladeSweep(this.owner, this.prevPts[i], this.prevPts[j], this.pts[i], this.pts[j], this.sweep);
    }
    for (let i = 0; i <= N; i++) this.prevPts[i].copy(this.pts[i]);
    this.hadPts = true;
    this.trail.emitting = !!this.sweep && this.ext > 0.2;
    this.trail.update(dt, this.pts[2], this.tip);
  }

  /** Instanced segments strung along a long lash, between the six real ones. */
  private layFill(at: (u: number, out: THREE.Vector3) => THREE.Vector3, hz: THREE.Vector3, e: number, maxFree: number): void {
    if (e < 0.08 || this.wrap > 0.05 || maxFree > 0.05) {
      this.fill.count = 0;
      return;
    }
    // path length, sampled
    let len = 0;
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    at(0, a);
    for (let i = 1; i <= 16; i++) {
      at(i / 16, b);
      len += a.distanceTo(b);
      a.copy(b);
    }
    const n = Math.min(FILL_MAX, Math.max(0, Math.floor(len / FILL_GAP) - N));
    let k = 0;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
    const tan = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n;
      // leave room round the real segments
      let near = false;
      let cum = 0;
      for (let j = 0; j < N && !near; j++) {
        if (Math.abs(u - cum / TOTAL) < 0.5 / (n + N)) near = true;
        cum += SEGMENT_LEN[j];
      }
      if (near) continue;
      at(u, a);
      at(Math.min(1, u + 0.01), b);
      tan.subVectors(b, a);
      if (tan.lengthSq() < 1e-10) tan.copy(hz);
      tan.normalize();
      q.setFromUnitVectors(hz, tan).multiply(_q);
      const s = (0.8 + 0.45 * u) * (1 + 0.45 * e) * Math.min(1, e * 2);
      sc.set(s, s, s);
      m.compose(a, q, sc);
      this.fill.setMatrixAt(k++, m);
    }
    this.fill.count = k;
    this.fill.instanceMatrix.needsUpdate = true;
    this.fillMat.userData.uniforms.uFlash.value.set(1, 0.3, 0.26, this.glow * 0.6);
  }

  dispose(): void {
    this.fill.removeFromParent();
    this.fillMat.dispose();
    for (const s of this.segs) {
      s.removeFromParent();
      s.material.dispose();
    }
    this.thread.removeFromParent();
    this.thread.geometry.dispose();
    (this.thread.material as THREE.Material).dispose();
    this.trail.mesh.removeFromParent();
  }
}
