// Haineko's ash (docs/kits/rangiku.md). The blade is a cloud: a few thousand grey grains, each a tiny voxel,
// simulated on the CPU and drawn as one InstancedMesh, with soft dust puffs spawned among them so the cloud has
// body. Every grain belongs to a group and every group has a formation — the cloud round Rangiku (group 0), a
// ribbon cracking out of the hilt, the spear, a geyser, the tide, Neko Rinbu's tornado, the shield's dome, the
// layered wall of "Hausu!", a coat clinging to a fighter, patches settled on the ground, the blade itself.
// Grains spring toward their slot with lag and churn, so ash handed from one group to another visibly pours
// across — the ash is never conjured, it always comes out of the cloud and goes back to it.
import * as THREE from 'three';
import type { Game } from '../game/game';
import type { Fighter } from '../game/fighter';
import { TEX_GLOW, TEX_PUFF, TEX_RING, TEX_STREAK, type SpriteSystem } from './sprites';

export const ASH = '#BDB8B1';
export const ASH_CLUMP = '#8F8A84';
export const ASH_LIGHT = '#D8D4CE';
export const ASH_CUT = '#EDEDED';
/** Rangiku's reiatsu: white with a pink rim */
export const RANGIKU_AURA = { core: '#FFFFFF', body: '#F4F4F6', rim: '#FFD9E6' };
/** the Gentei Reiin's daffodil */
export const DAFFODIL = '#E8C14A';

export type AshFormation =
  /** the idle cloud round her: a loose churning drift */
  | { kind: 'cloud'; center: THREE.Vector3; radius: number; height: number; spin: number }
  /** a pour along the curve from → ctrl → to (grains that reach the end start again at the hilt) */
  | { kind: 'stream'; from: THREE.Vector3; ctrl: THREE.Vector3; to: THREE.Vector3; radius: number; speed: number }
  /** a rod along the curve from → ctrl → to (straight when ctrl is the midpoint), filled up to `reach` (0..1) */
  | { kind: 'line'; from: THREE.Vector3; ctrl: THREE.Vector3; to: THREE.Vector3; radius: number; reach: number }
  /** a column erupting from the ground (height grows) */
  | { kind: 'column'; base: THREE.Vector3; radius: number; height: number; spin: number }
  /** a funnel whirling round its eye */
  | { kind: 'tornado'; center: THREE.Vector3; radius: number; height: number; spin: number }
  /** a front rolling along dir */
  | { kind: 'wave'; origin: THREE.Vector3; dir: THREE.Vector3; width: number; height: number; front: number; depth: number }
  | { kind: 'dome'; center: THREE.Vector3; radius: number }
  /** thin sheets stacked along the normal (the layered wall) */
  | { kind: 'layers'; center: THREE.Vector3; normal: THREE.Vector3; width: number; height: number; layers: number; gap: number }
  /** clinging to a body (base = the feet) */
  | { kind: 'coat'; base: THREE.Vector3; radius: number; height: number }
  /** settled in discs on surfaces */
  | { kind: 'patches'; points: THREE.Vector3[]; normals: THREE.Vector3[]; radius: number }
  /** a shell blown outward */
  | { kind: 'burst'; center: THREE.Vector3; radius: number };

export interface AshGroup {
  f: AshFormation;
  /** spring toward the slot, velocity damping, churn */
  k: number;
  c: number;
  turb: number;
  /** grain size multiplier */
  size: number;
}

const TAU = Math.PI * 2;
const MAX_GROUPS = 48;
const _t = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _n = new THREE.Vector3();
const _bn = new THREE.Vector3();
const _side = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _m = new THREE.Matrix4();
const _s = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
const C_ASH = new THREE.Color(ASH);
const C_CLUMP = new THREE.Color(ASH_CLUMP);
const C_LIGHT = new THREE.Color(ASH_LIGHT);
const C_PUFF = new THREE.Color('#B3AEA8');

function frac(x: number): number {
  return x - Math.floor(x);
}

function bezier(from: THREE.Vector3, ctrl: THREE.Vector3, to: THREE.Vector3, u: number, out: THREE.Vector3): THREE.Vector3 {
  const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
  return out.set(from.x * a + ctrl.x * b + to.x * c, from.y * a + ctrl.y * b + to.y * c, from.z * a + ctrl.z * b + to.z * c);
}

function bezierTangent(from: THREE.Vector3, ctrl: THREE.Vector3, to: THREE.Vector3, u: number, out: THREE.Vector3): THREE.Vector3 {
  out.set(
    2 * (1 - u) * (ctrl.x - from.x) + 2 * u * (to.x - ctrl.x),
    2 * (1 - u) * (ctrl.y - from.y) + 2 * u * (to.y - ctrl.y),
    2 * (1 - u) * (ctrl.z - from.z) + 2 * u * (to.z - ctrl.z),
  );
  return out.lengthSq() > 1e-8 ? out.normalize() : out.set(0, 0, 1);
}

/** two unit vectors across the direction d (d need not be normalised) */
function across(d: THREE.Vector3, n: THREE.Vector3, b: THREE.Vector3): void {
  n.crossVectors(d, UP);
  if (n.lengthSq() < 1e-6) n.set(1, 0, 0);
  n.normalize();
  b.crossVectors(d, n).normalize();
}

/** a point on a stream's curve: where grain u sits, with its spread across the curve */
export function streamPoint(f: Extract<AshFormation, { kind: 'stream' }>, u: number, out: THREE.Vector3): THREE.Vector3 {
  return bezier(f.from, f.ctrl, f.to, u, out);
}

export class AshGrains {
  readonly mesh: THREE.InstancedMesh;
  readonly max: number;
  count = 0;
  /** global fade (the recall) */
  alpha = 1;
  readonly groups: (AshGroup | null)[] = [];
  /** grains per group */
  readonly members = new Int32Array(MAX_GROUPS);
  private p: Float32Array;
  private v: Float32Array;
  private seed: Float32Array;
  private grp: Uint8Array;
  private tint: Float32Array;
  private time = 0;

  constructor(max: number, home: AshFormation) {
    this.max = max;
    this.p = new Float32Array(max * 3);
    this.v = new Float32Array(max * 3);
    this.seed = new Float32Array(max * 4);
    this.grp = new Uint8Array(max);
    this.tint = new Float32Array(max);
    for (let i = 0; i < max * 4; i++) this.seed[i] = Math.random();
    for (let i = 0; i < max; i++) this.tint[i] = Math.random();
    this.groups[0] = { f: home, k: 9, c: 2.8, turb: 0.5, size: 1 };
    const geo = new THREE.BoxGeometry(1, 1, 1);
    // ash is pale and catches the light from every side: lit, and glowing a little of its own grey (the glow
    // follows each grain's shade, so the clumps stay darker and a glint sparkles)
    const mat = new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.22 });
    mat.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace(
        'vec3 totalEmissiveRadiance = emissive;',
        'vec3 totalEmissiveRadiance = emissive;\n#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )\n  totalEmissiveRadiance *= vColor.rgb;\n#endif',
      );
    };
    this.mesh = new THREE.InstancedMesh(geo, mat, max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3);
    this.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = false;
    this.mesh.count = 0;
  }

  // ---------------------------------------------------------------- groups

  /** a new group with this formation (−1 when every slot is taken) */
  open(f: AshFormation, o: Partial<Omit<AshGroup, 'f'>> = {}): number {
    for (let i = 1; i < MAX_GROUPS; i++) {
      if (this.groups[i]) continue;
      this.groups[i] = { f, k: o.k ?? 18, c: o.c ?? 5, turb: o.turb ?? 1, size: o.size ?? 1 };
      this.members[i] = 0;
      return i;
    }
    return -1;
  }

  group(gid: number): AshGroup | null {
    return gid >= 0 ? this.groups[gid] ?? null : null;
  }

  /**
   * Hand up to n grains from one group to another, the nearest to `near` first; returns how many went. With
   * `place` the grains are put there first (the ash pouring out of the hilt, or up out of the ground), with `vel`.
   */
  move(from: number, to: number, n: number, near?: THREE.Vector3, place?: (out: THREE.Vector3) => THREE.Vector3, vel?: (out: THREE.Vector3) => THREE.Vector3): number {
    if (n <= 0 || from === to || !this.groups[to]) return 0;
    const idx: number[] = [];
    for (let i = 0; i < this.count; i++) if (this.grp[i] === from) idx.push(i);
    if (near && idx.length > n) {
      const d = (i: number) => (this.p[i * 3] - near.x) ** 2 + (this.p[i * 3 + 1] - near.y) ** 2 + (this.p[i * 3 + 2] - near.z) ** 2;
      idx.sort((a, b) => d(a) - d(b));
    }
    const k = Math.min(n, idx.length);
    for (let j = 0; j < k; j++) {
      const i = idx[j];
      this.grp[i] = to;
      if (place) {
        place(_t);
        this.p[i * 3] = _t.x; this.p[i * 3 + 1] = _t.y; this.p[i * 3 + 2] = _t.z;
        const w = vel ? vel(_a) : _a.set(0, 0, 0);
        this.v[i * 3] = w.x; this.v[i * 3 + 1] = w.y; this.v[i * 3 + 2] = w.z;
      }
    }
    this.members[from] -= k;
    this.members[to] += k;
    return k;
  }

  /** soft puffs along a curve (a move's body): u in [u0, 1] */
  puffsAlong(dust: SpriteSystem, at: (u: number, out: THREE.Vector3) => THREE.Vector3, n: number, size: number, alpha: number, u0 = 0.2, life = 0.55): void {
    for (let k = 0; k < n; k++) {
      const p = at(u0 + Math.random() * (1 - u0), _b);
      const s = size * (0.7 + Math.random() * 0.6);
      dust.spawn({ x: p.x + (Math.random() - 0.5) * 0.3, y: p.y + (Math.random() - 0.5) * 0.3, z: p.z + (Math.random() - 0.5) * 0.3, vx: (Math.random() - 0.5) * 0.8, vy: 0.2, vz: (Math.random() - 0.5) * 0.8, size: s, sizeEnd: s * 1.8, life: life * (0.7 + Math.random() * 0.6), r: C_PUFF.r, g: C_PUFF.g, b: C_PUFF.b, alpha: alpha * this.alpha, alphaEnd: 0, tex: TEX_PUFF, drag: 1.8, spin: (Math.random() - 0.5) * 0.8 });
    }
  }

  /** the group's grains go home to the cloud and the group closes */
  close(gid: number): void {
    if (gid <= 0 || !this.groups[gid]) return;
    for (let i = 0; i < this.count; i++) if (this.grp[i] === gid) this.grp[i] = 0;
    this.members[0] += this.members[gid];
    this.members[gid] = 0;
    this.groups[gid] = null;
  }

  /** add grains (up to max) to group gid, appearing at spawn(i) */
  grow(n: number, gid: number, spawn: (i: number, out: THREE.Vector3) => THREE.Vector3, vel?: (i: number, out: THREE.Vector3) => THREE.Vector3): number {
    const end = Math.min(this.max, this.count + Math.max(0, Math.floor(n)));
    const added = end - this.count;
    for (let i = this.count; i < end; i++) {
      const o = spawn(i, _t);
      const j = i * 3;
      this.p[j] = o.x; this.p[j + 1] = o.y; this.p[j + 2] = o.z;
      const w = vel ? vel(i, _a) : _a.set((Math.random() - 0.5) * 2, Math.random() * 1.5, (Math.random() - 0.5) * 2);
      this.v[j] = w.x; this.v[j + 1] = w.y; this.v[j + 2] = w.z;
      this.grp[i] = gid;
    }
    this.count = end;
    this.members[gid] += added;
    this.mesh.count = end;
    return added;
  }

  /** remove n grains, from group `prefer` first; `at` is told where each one went (for a puff) */
  kill(n: number, prefer = 0, at?: (p: THREE.Vector3) => void): number {
    let left = Math.min(n, this.count);
    const killed = left;
    for (let pass = 0; pass < 2 && left > 0; pass++) {
      for (let i = this.count - 1; i >= 0 && left > 0; i--) {
        if (pass === 0 && this.grp[i] !== prefer) continue;
        if (at) at(this.pos(i, _b));
        this.removeAt(i);
        left--;
      }
    }
    this.mesh.count = this.count;
    return killed - left;
  }

  private removeAt(i: number): void {
    const j = this.count - 1;
    this.members[this.grp[i]]--;
    if (i !== j) {
      for (let k = 0; k < 3; k++) {
        this.p[i * 3 + k] = this.p[j * 3 + k];
        this.v[i * 3 + k] = this.v[j * 3 + k];
      }
      for (let k = 0; k < 4; k++) this.seed[i * 4 + k] = this.seed[j * 4 + k];
      this.grp[i] = this.grp[j];
      this.tint[i] = this.tint[j];
    }
    this.count = j;
  }

  pos(i: number, out: THREE.Vector3): THREE.Vector3 {
    return out.set(this.p[i * 3], this.p[i * 3 + 1], this.p[i * 3 + 2]);
  }

  /** a random member of group gid (−1 when it has none) */
  pick(gid: number): number {
    if (this.members[gid] <= 0 || this.count === 0) return -1;
    for (let k = 0; k < 24; k++) {
      const i = Math.floor(Math.random() * this.count);
      if (this.grp[i] === gid) return i;
    }
    for (let i = 0; i < this.count; i++) if (this.grp[i] === gid) return i;
    return -1;
  }

  /** the members' centroid (the middle of a group) */
  centroid(gid: number, out: THREE.Vector3): THREE.Vector3 {
    out.set(0, 0, 0);
    let n = 0;
    for (let i = 0; i < this.count; i++) {
      if (this.grp[i] !== gid) continue;
      out.x += this.p[i * 3]; out.y += this.p[i * 3 + 1]; out.z += this.p[i * 3 + 2];
      n++;
    }
    return n ? out.divideScalar(n) : out;
  }

  /** push every grain of a group (a blast through the cloud) */
  kick(gid: number, from: THREE.Vector3, speed: number): void {
    for (let i = 0; i < this.count; i++) {
      if (gid >= 0 && this.grp[i] !== gid) continue;
      const j = i * 3;
      _a.set(this.p[j] - from.x, this.p[j + 1] - from.y, this.p[j + 2] - from.z);
      const d = _a.length() || 1;
      const s = speed * (0.6 + 0.8 * this.seed[i * 4 + 2]) / d;
      this.v[j] += _a.x * s; this.v[j + 1] += _a.y * s * 0.6 + 1; this.v[j + 2] += _a.z * s;
    }
  }

  // ---------------------------------------------------------------- formations

  /** where grain i wants to be in its group's formation */
  slot(i: number, out: THREE.Vector3): THREE.Vector3 {
    const G = this.groups[this.grp[i]] ?? this.groups[0]!;
    const s0 = this.seed[i * 4], s1 = this.seed[i * 4 + 1], s2 = this.seed[i * 4 + 2], s3 = this.seed[i * 4 + 3];
    const t = this.time;
    const f = G.f;
    switch (f.kind) {
      case 'cloud': {
        // most of it curls round her in three tilted ribbons (the cat winding round her legs), the rest a loose haze
        if (s3 < 0.82) {
          const band = Math.floor(s3 / 0.82 * 3);
          const ph = band * 2.1 + t * f.spin * (band === 1 ? -1 : 1) * (0.8 + band * 0.15);
          const a = ph + (s0 - 0.5) * 3.6;
          const r = f.radius * (0.82 + 0.14 * s1) * (1 + 0.08 * Math.sin(t * 0.8 + band));
          const tilt = 0.4 + band * 0.15;
          const y = (band - 1) * f.height * 0.26 + Math.sin(a - ph * 0.5 + band) * tilt * f.radius * 0.5 + (s2 - 0.5) * 0.22;
          // the ribbon thins toward its ends
          const thin = 1 - Math.abs(s0 - 0.5) * 1.2;
          return out.set(f.center.x + Math.cos(a) * r, f.center.y + y * (0.6 + 0.4 * thin), f.center.z + Math.sin(a) * r);
        }
        const a = s0 * TAU + t * f.spin * 0.4;
        const r = f.radius * (0.4 + 0.75 * Math.sqrt(s1));
        const y = (s2 - 0.45) * f.height + Math.sin(t * 0.9 + s3 * TAU) * 0.24;
        return out.set(f.center.x + Math.cos(a) * r, f.center.y + y, f.center.z + Math.sin(a) * r);
      }
      case 'stream': {
        const u = frac(s0 + t * f.speed * (0.8 + 0.4 * s3));
        bezier(f.from, f.ctrl, f.to, u, out);
        bezierTangent(f.from, f.ctrl, f.to, u, _a);
        across(_a, _n, _bn);
        const ang = s1 * TAU + t * 5;
        // thin at the hilt, swelling along the way
        const rad = f.radius * Math.sqrt(s2) * (0.25 + 0.75 * Math.sin(Math.PI * Math.min(1, 0.15 + u * 0.95)));
        return out.addScaledVector(_n, Math.cos(ang) * rad).addScaledVector(_bn, Math.sin(ang) * rad);
      }
      case 'line': {
        const u = s0 * f.reach;
        bezier(f.from, f.ctrl, f.to, u, out);
        bezierTangent(f.from, f.ctrl, f.to, u, _a);
        across(_a, _n, _bn);
        const ang = s1 * TAU + t * 9 * (s3 - 0.5);
        const rad = f.radius * Math.sqrt(s2) * (0.5 + 0.5 * Math.sin(Math.PI * Math.min(1, 0.2 + u)));
        return out.addScaledVector(_n, Math.cos(ang) * rad).addScaledVector(_bn, Math.sin(ang) * rad);
      }
      case 'column': {
        const y = s0 * f.height;
        const r = f.radius * (0.3 + 0.7 * (y / Math.max(0.1, f.height))) * Math.sqrt(s1);
        const a = s2 * TAU + t * f.spin * (0.7 + 0.6 * s3);
        return out.set(f.base.x + Math.cos(a) * r, f.base.y + y, f.base.z + Math.sin(a) * r);
      }
      case 'tornado': {
        const y = s0 * f.height;
        const k = y / Math.max(0.1, f.height);
        const r = f.radius * (0.55 + 0.45 * k) * (0.82 + 0.3 * s1);
        const a = s2 * TAU + t * f.spin * (1.25 - 0.45 * s0) + Math.sin(t * 3 + s3 * 7) * 0.12;
        return out.set(f.center.x + Math.cos(a) * r, f.center.y + y + Math.sin(t * 4 + s3 * 9) * 0.15, f.center.z + Math.sin(a) * r);
      }
      case 'wave': {
        _side.set(f.dir.z, 0, -f.dir.x).normalize();
        const curl = Math.sin(s0 * 12 + t * 3) * 0.35;
        const z = f.front - s2 * s2 * f.depth;
        // a breaking crest: tall at the front, low behind it
        const y = s1 * f.height * (1 - 0.35 * Math.abs(s0 - 0.5) * 2) * (1 - 0.55 * s2) + curl;
        return out.copy(f.origin).addScaledVector(_side, (s0 - 0.5) * f.width).addScaledVector(f.dir, z + Math.sin(t * 5 + s3 * 9) * 0.25).setY(f.origin.y + Math.max(0.05, y));
      }
      case 'dome': {
        const th = s0 * TAU + t * 1.6 * (s3 < 0.5 ? 1 : -1);
        const ph = Math.acos(s1) * 0.98;
        const r = f.radius * (0.9 + 0.2 * s2);
        return out.set(f.center.x + Math.sin(ph) * Math.cos(th) * r, f.center.y + Math.cos(ph) * r - 0.2, f.center.z + Math.sin(ph) * Math.sin(th) * r);
      }
      case 'layers': {
        _side.crossVectors(UP, f.normal).normalize();
        const li = Math.floor(s3 * f.layers);
        const swirl = t * 1.5 + s3 * TAU;
        return out.copy(f.center).addScaledVector(_side, (s0 - 0.5) * f.width + Math.cos(swirl) * 0.06)
          .addScaledVector(UP, (s1 - 0.5) * f.height + Math.sin(swirl) * 0.06)
          .addScaledVector(f.normal, (li - (f.layers - 1) / 2) * f.gap + (s2 - 0.5) * 0.06);
      }
      case 'coat': {
        const a = s0 * TAU + t * 0.4 * (s3 - 0.5);
        const y = 0.06 + s1 * (f.height - 0.1);
        const head = y > f.height * 0.8 ? 0.72 : 1;
        const r = f.radius * (0.9 + 0.3 * s2) * head;
        return out.set(f.base.x + Math.cos(a) * r, f.base.y + y, f.base.z + Math.sin(a) * r);
      }
      case 'patches': {
        const n = f.points.length;
        if (!n) return out.copy(this.pos(i, out));
        const k = Math.min(n - 1, Math.floor(s0 * n));
        const pn = f.normals[k];
        across(pn, _n, _bn);
        const r = f.radius * Math.sqrt(s1), a = s2 * TAU;
        return out.copy(f.points[k]).addScaledVector(_n, Math.cos(a) * r).addScaledVector(_bn, Math.sin(a) * r).addScaledVector(pn, 0.03 + s3 * 0.05);
      }
      case 'burst': {
        const th = s0 * TAU, z = s1 * 2 - 1, q = Math.sqrt(1 - z * z);
        const r = f.radius * (0.6 + 0.4 * s2);
        return out.set(f.center.x + Math.cos(th) * q * r, f.center.y + Math.abs(z) * r * 0.8, f.center.z + Math.sin(th) * q * r);
      }
    }
  }

  update(dt: number): void {
    const t0 = this.time;
    this.time += dt;
    const t = this.time;
    for (let i = 0; i < this.count; i++) {
      let gi = this.grp[i];
      let G = this.groups[gi];
      if (!G) {
        this.members[gi]--;
        gi = this.grp[i] = 0;
        this.members[0]++;
        G = this.groups[0]!;
      }
      const j = i * 3;
      this.slot(i, _t);
      const f = G.f;
      if (f.kind === 'stream') {
        // a grain that ran off the end starts again at the hilt instead of flying back along the curve
        const s0 = this.seed[i * 4], sp = f.speed * (0.8 + 0.4 * this.seed[i * 4 + 3]);
        if (frac(s0 + t0 * sp) > frac(s0 + t * sp)) {
          this.p[j] = _t.x; this.p[j + 1] = _t.y; this.p[j + 2] = _t.z;
          bezierTangent(f.from, f.ctrl, f.to, 0, _a);
          const len = f.from.distanceTo(f.to);
          this.v[j] = _a.x * len * sp; this.v[j + 1] = _a.y * len * sp; this.v[j + 2] = _a.z * len * sp;
          continue;
        }
      }
      const s3 = this.seed[i * 4 + 3];
      const tb = G.turb;
      const px = this.p[j], py = this.p[j + 1], pz = this.p[j + 2];
      const fx = (_t.x - px) * G.k + tb * (Math.sin(t * 2.1 + s3 * 40 + py * 1.3) + Math.sin(t * 1.3 + pz * 0.9)) * 0.9;
      const fy = (_t.y - py) * G.k + tb * Math.cos(t * 1.7 + s3 * 31 + px * 1.1) * 0.8;
      const fz = (_t.z - pz) * G.k + tb * (Math.sin(t * 2.4 + s3 * 17 + py * 0.9) + Math.cos(t * 1.1 + px * 0.8)) * 0.9;
      const damp = Math.exp(-G.c * dt);
      this.v[j] = (this.v[j] + fx * dt) * damp;
      this.v[j + 1] = (this.v[j + 1] + fy * dt) * damp;
      this.v[j + 2] = (this.v[j + 2] + fz * dt) * damp;
      this.p[j] += this.v[j] * dt;
      this.p[j + 1] += this.v[j + 1] * dt;
      this.p[j + 2] += this.v[j + 2] * dt;
    }
  }

  /** instance transforms (tumbling grains, clumps bigger) and colours (ash, clumps, the odd glint) */
  render(time: number): void {
    const im = this.mesh.instanceMatrix.array as Float32Array;
    const ic = this.mesh.instanceColor!.array as Float32Array;
    const a = this.alpha;
    for (let i = 0; i < this.count; i++) {
      const j = i * 3;
      const s0 = this.seed[i * 4], s1 = this.seed[i * 4 + 1], s2 = this.seed[i * 4 + 2];
      const G = this.groups[this.grp[i]] ?? this.groups[0]!;
      _e.set(s0 * TAU + time * (1 + s1 * 3), s1 * TAU + time * (0.5 + s2 * 2), s2 * TAU);
      _q.setFromEuler(_e);
      const w = this.tint[i];
      const clump = w < 0.2;
      const sc = a * G.size * (clump ? 0.036 + s2 * 0.012 : 0.017 + s2 * 0.013);
      _m.compose(_b.set(this.p[j], this.p[j + 1], this.p[j + 2]), _q, _s.set(sc, sc, sc));
      _m.toArray(im, i * 16);
      const c = clump ? C_CLUMP : w > 0.9 ? C_LIGHT : C_ASH;
      const glint = Math.sin(time * 7 + s1 * 60) > 0.985 ? 2.6 : 0.85 + 0.2 * s0;
      ic[j] = c.r * glint;
      ic[j + 1] = c.g * glint;
      ic[j + 2] = c.b * glint;
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor!.needsUpdate = true;
  }

  /** soft dust puffs among a group's grains (the cloud's body) */
  puffs(dust: SpriteSystem, gid: number, n: number, size: number, alpha: number, life = 0.9): void {
    for (let k = 0; k < n; k++) {
      const i = this.pick(gid);
      if (i < 0) return;
      const j = i * 3;
      const s = size * (0.7 + Math.random() * 0.6);
      dust.spawn({
        x: this.p[j], y: this.p[j + 1], z: this.p[j + 2],
        vx: this.v[j] * 0.3, vy: this.v[j + 1] * 0.3 + 0.15, vz: this.v[j + 2] * 0.3,
        size: s, sizeEnd: s * 1.7, life: life * (0.7 + Math.random() * 0.6),
        r: C_PUFF.r, g: C_PUFF.g, b: C_PUFF.b, alpha: alpha * this.alpha, alphaEnd: 0, tex: TEX_PUFF, drag: 1.6, spin: (Math.random() - 0.5) * 0.8,
      });
    }
  }

  /** white glints winking in a group */
  glints(glow: SpriteSystem, gid: number, n: number): void {
    for (let k = 0; k < n; k++) {
      const i = this.pick(gid);
      if (i < 0) return;
      const j = i * 3;
      glow.spawn({ x: this.p[j], y: this.p[j + 1], z: this.p[j + 2], size: 0.09, sizeEnd: 0.02, life: 0.3, r: 1, g: 1, b: 1, alpha: 0.9 * this.alpha, alphaEnd: 0, tex: TEX_GLOW });
    }
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

// ---------------------------------------------------------------------------------------------- one-shot effects

/** a few puffs of ash at a point */
export function ashPuff(g: Game, p: THREE.Vector3, n = 4, size = 0.8, speed = 1.5): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, s = Math.random() * speed;
    const sz = size * (0.7 + Math.random() * 0.6);
    g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: Math.cos(a) * s, vy: 0.2 + Math.random() * 0.6, vz: Math.sin(a) * s, size: sz, sizeEnd: sz * 2.2, life: 0.9 + Math.random() * 0.6, r: C_PUFF.r, g: C_PUFF.g, b: C_PUFF.b, alpha: 0.32, alphaEnd: 0, tex: TEX_PUFF, drag: 1.8, spin: (Math.random() - 0.5) * 0.8 });
  }
}

/** the flick-cut's slit of light where settled ash cuts (white streaks along the cut) */
export function cutFlash(g: Game, p: THREE.Vector3, dir: THREE.Vector3, len = 1.2): void {
  const glow = g.engine.glow;
  for (let i = 0; i < 7; i++) {
    const u = (i / 6 - 0.5) * len;
    glow.spawn({ x: p.x + dir.x * u, y: p.y + dir.y * u, z: p.z + dir.z * u, vx: dir.x * 3, vy: dir.y * 3, vz: dir.z * 3, size: 0.26, sizeEnd: 0.05, life: 0.22, r: 0.95, g: 0.95, b: 0.95, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 4, drag: 4 });
  }
  glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.4, sizeEnd: 1.5, life: 0.16, r: 1, g: 0.96, b: 0.97, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
  ashPuff(g, p, 2, 0.5, 2.5);
}

/**
 * Gentei Kaijo: the daffodil seal on her chest flares and dissolves; a column of white reiatsu goes up round her.
 */
export function limiterBurst(g: Game, f: Fighter, chest: THREE.Vector3): void {
  const glow = g.engine.glow;
  const yel = new THREE.Color(DAFFODIL);
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * TAU, s = 1 + Math.random() * 3;
    glow.spawn({ x: chest.x, y: chest.y, z: chest.z, vx: Math.cos(a) * s, vy: 1 + Math.random() * 3, vz: Math.sin(a) * s, size: 0.1, sizeEnd: 0.02, life: 0.9, r: yel.r * 1.6, g: yel.g * 1.6, b: yel.b * 1.6, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 1.2 });
  }
  glow.spawn({ x: chest.x, y: chest.y, z: chest.z, size: 0.4, sizeEnd: 2.4, life: 0.35, r: yel.r * 2, g: yel.g * 2, b: yel.b * 2, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  // the column
  const p = f.pos;
  for (let i = 0; i < 70; i++) {
    const a = Math.random() * TAU, r = 0.4 + Math.random() * 1.1;
    glow.spawn({ x: p.x + Math.cos(a) * r, y: p.y + Math.random() * 0.5, z: p.z + Math.sin(a) * r, vy: 9 + Math.random() * 12, size: 0.2 + Math.random() * 0.3, sizeEnd: 0.05, life: 0.8 + Math.random() * 0.5, r: 1, g: 0.92, b: 0.96, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 0.6 });
  }
  g.addRing(new THREE.Vector3(p.x, p.y + 0.1, p.z), 5, RANGIKU_AURA.rim, 0.6);
}

/** Tenteikūra: a web of reiatsu threads cast out from her to every fighter she can reach */
export function tenteiWeb(g: Game, f: Fighter, to: Fighter[]): void {
  const glow = g.engine.glow;
  const c = f.center(_a);
  c.y += 0.5;
  for (const o of to) {
    const d = o.center(_b).sub(c);
    const n = Math.min(26, 6 + Math.floor(d.length() * 1.2));
    for (let i = 0; i < n; i++) {
      const u = i / n;
      glow.spawn({ x: c.x + d.x * u, y: c.y + d.y * u + Math.sin(u * Math.PI) * 1.2, z: c.z + d.z * u, size: 0.12, sizeEnd: 0.02, life: 0.5 + u * 0.5, r: 1, g: 0.86, b: 0.92, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    }
  }
  for (let i = 0; i < 3; i++) glow.spawn({ x: c.x, y: c.y, z: c.z, size: 0.4, sizeEnd: 7 + i * 3, life: 0.6 + i * 0.2, r: 1, g: 0.85, b: 0.92, alpha: 0.6, alphaEnd: 0, tex: TEX_RING });
}
