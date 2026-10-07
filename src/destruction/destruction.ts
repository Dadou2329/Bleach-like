// The destruction pipeline: carve shapes → debris & dust → integrity check → falling fragments.
import * as THREE from 'three';
import { NumSet } from '../core/numset';
import { F_FLAMMABLE, F_INDESTRUCTIBLE, F_LIQUID, F_SOLID } from '../voxel/materials';
import type { VoxelWorld } from '../voxel/world';
import type { DebrisSystem } from '../vfx/debris';
import { TEX_GLOW, TEX_STREAK, type SpriteSystem } from '../vfx/sprites';
import type { FragmentSystem, SlidePlane } from './fragments';
import { IntegrityChecker } from './integrity';
import { BoxShape, type DamageShape } from './shapes';

export type CarveMode = 'smash' | 'cut' | 'bore' | 'explode' | 'burn' | 'erase' | 'melt' | 'rot';

export interface CarveOptions {
  mode: CarveMode;
  /** compared against material hardness (a strong punch ≈ 10, a Getsuga ≈ 300, Kendō ≈ 5000) */
  power: number;
  /** power multiplier at the shape's surface (core = 1) */
  edge?: number;
  /** 0..1 fraction of removed voxels that become debris (capped) */
  debris?: number;
  /** dust amount multiplier */
  dust?: number;
  /** debris/fragment speed (m/s) */
  impulse?: number;
  /** push direction for debris & fragments (cuts: along the cut plane) */
  dir?: THREE.Vector3;
  /** spark colour for cuts/bores (linear rgb) */
  sparks?: [number, number, number];
  /** skip the integrity check (pure cosmetic carves) */
  noCollapse?: boolean;
}

export interface CarveResult {
  removed: number;
  /** most common material removed (for SFX) */
  mainMaterial: number;
}

const _dir = new THREE.Vector3();
/** the dust things rot to */
const ROT_DUST = new THREE.Color('#7A6E5E');

export class DestructionSystem {
  readonly integrity: IntegrityChecker;
  private seeds = new NumSet(4096);
  /** one entry per carve this frame: its integrity seeds and how detached pieces should move */
  private pending: { seeds: number[]; dir: THREE.Vector3; cut: boolean; plane: SlidePlane | null }[] = [];
  maxDebrisPerCarve = 700;
  stats = { carves: 0, removed: 0 };
  /** observer for sound/feedback: called after every carve that removed something */
  onCarve: ((center: THREE.Vector3, removed: number, mode: string) => void) | null = null;

  constructor(
    readonly world: VoxelWorld,
    readonly debris: DebrisSystem,
    readonly dust: SpriteSystem,
    readonly glow: SpriteSystem,
    readonly fragments: FragmentSystem,
  ) {
    this.integrity = new IntegrityChecker(world);
  }

  carve(shape: DamageShape, opts: CarveOptions): CarveResult {
    const w = this.world;
    const mats = w.mats;
    const vs = w.vs;
    const edge = opts.edge ?? 0.55;
    const removedX: number[] = [], removedY: number[] = [], removedZ: number[] = [], removedM: number[] = [];
    const matCount = new Map<number, number>();
    const burnMap = new Map<number, number>();
    // rot: what it cannot crumble yet it turns to decayed matter (which crumbles at the next breath)
    const decayed = opts.mode === 'rot' && mats.has('decayed') ? mats.id('decayed') : -1;
    shape.forEachVoxel(vs, (x, y, z, depth) => {
      if (!w.inBounds(x, y, z)) return;
      const m = w.get(x, y, z);
      if (m === 0) return;
      const f = mats.flags[m];
      if (f & F_INDESTRUCTIBLE) return;
      const p = opts.power * (edge + (1 - edge) * depth);
      const hard = mats.hardness[m];
      if (opts.mode === 'burn') {
        if (p < hard * 0.25) return;
        let to = burnMap.get(m);
        if (to === undefined) {
          const def = mats.def(m);
          to = def.onBurn && mats.has(def.onBurn) ? mats.id(def.onBurn) : f & F_FLAMMABLE ? 0 : -1;
          burnMap.set(m, to);
        }
        if (to >= 0 && to !== m) {
          w.set(x, y, z, to);
          if (to === 0) { removedX.push(x); removedY.push(y); removedZ.push(z); removedM.push(m); }
          return;
        }
        if (p < hard) return;
      } else if (opts.mode === 'rot') {
        if (p < hard) {
          if (decayed > 0 && m !== decayed && p >= hard * 0.2 && !(f & F_LIQUID)) w.set(x, y, z, decayed);
          return;
        }
      } else if (p < hard) return;
      w.set(x, y, z, 0);
      removedX.push(x); removedY.push(y); removedZ.push(z); removedM.push(m);
      matCount.set(m, (matCount.get(m) ?? 0) + 1);
    });
    const n = removedX.length;
    this.stats.carves++;
    this.stats.removed += n;
    if (n === 0) return { removed: 0, mainMaterial: 0 };
    // ---- debris
    const mode = opts.mode;
    const debrisFrac = opts.debris ?? (mode === 'cut' ? 0.06 : mode === 'erase' || mode === 'melt' || mode === 'rot' ? 0 : mode === 'bore' ? 0.18 : 0.35);
    const target = Math.min(this.maxDebrisPerCarve, Math.ceil(n * debrisFrac));
    const impulse = opts.impulse ?? (mode === 'explode' ? 14 : mode === 'cut' ? 3 : 8);
    const c = shape.center;
    for (let k = 0; k < target; k++) {
      const i = Math.floor(Math.random() * n);
      const px = (removedX[i] + 0.5) * vs, py = (removedY[i] + 0.5) * vs, pz = (removedZ[i] + 0.5) * vs;
      _dir.set(px - c.x, py - c.y, pz - c.z);
      if (_dir.lengthSq() < 1e-6) _dir.set(Math.random() - 0.5, 1, Math.random() - 0.5);
      _dir.normalize();
      if (opts.dir) _dir.lerp(opts.dir, mode === 'cut' ? 0.8 : 0.35).normalize();
      const sp = impulse * (0.35 + Math.random() * 0.9);
      const size = vs * (0.55 + Math.random() * 0.75);
      this.debris.spawn(px, py, pz, _dir.x * sp + (Math.random() - 0.5) * 2, _dir.y * sp + 2 + Math.random() * 4, _dir.z * sp + (Math.random() - 0.5) * 2, size, removedM[i], 3 + Math.random() * 4);
    }
    // ---- dust
    const dustAmt = (opts.dust ?? 1) * (mode === 'cut' ? 0.4 : mode === 'melt' || mode === 'erase' ? 0.1 : mode === 'rot' ? 1.6 : 1);
    const puffs = Math.min(40, Math.ceil(Math.sqrt(n) * 0.5 * dustAmt));
    let main = 0, mainN = 0;
    for (const [m, cnt] of matCount) if (cnt > mainN) { main = m; mainN = cnt; }
    const dc = mode === 'rot' ? ROT_DUST.clone().lerp(this.dustColor(main), 0.25) : this.dustColor(main);
    for (let k = 0; k < puffs; k++) {
      const i = Math.floor(Math.random() * n);
      const px = (removedX[i] + 0.5) * vs, py = (removedY[i] + 0.5) * vs, pz = (removedZ[i] + 0.5) * vs;
      _dir.set(px - c.x, py - c.y + 0.5, pz - c.z).normalize();
      const sp = 1 + Math.random() * 3;
      this.dust.spawn({
        x: px, y: py, z: pz, vx: _dir.x * sp, vy: _dir.y * sp + 0.6, vz: _dir.z * sp,
        size: 1 + Math.random() * 1.5, sizeEnd: 3.5 + Math.random() * 4 + Math.sqrt(n) * 0.02, life: 2.2 + Math.random() * 2.5,
        r: dc.r, g: dc.g, b: dc.b, alpha: 0.5, alphaEnd: 0, drag: 1.4, spin: (Math.random() - 0.5) * 0.5,
      });
    }
    // ---- sparks for cuts and bores
    if ((mode === 'cut' || mode === 'bore') && opts.sparks) {
      const [r, g, b] = opts.sparks;
      const sparks = Math.min(60, 6 + Math.floor(n * 0.05));
      for (let k = 0; k < sparks; k++) {
        const i = Math.floor(Math.random() * n);
        const sp = 6 + Math.random() * 10;
        this.glow.spawn({
          x: (removedX[i] + 0.5) * vs, y: (removedY[i] + 0.5) * vs, z: (removedZ[i] + 0.5) * vs,
          vx: (Math.random() - 0.5) * sp, vy: Math.random() * sp * 0.7, vz: (Math.random() - 0.5) * sp,
          size: 0.08 + Math.random() * 0.08, life: 0.25 + Math.random() * 0.35, r, g, b, alpha: 1, alphaEnd: 0,
          gravity: -12, drag: 1.5, tex: TEX_STREAK, stretch: 1,
        });
      }
      for (let k = 0; k < Math.min(8, sparks / 6); k++) {
        const i = Math.floor(Math.random() * n);
        this.glow.spawn({
          x: (removedX[i] + 0.5) * vs, y: (removedY[i] + 0.5) * vs, z: (removedZ[i] + 0.5) * vs,
          size: 0.8 + Math.random(), sizeEnd: 0.2, life: 0.18, r: r * 0.6, g: g * 0.6, b: b * 0.6, alpha: 1, alphaEnd: 0, tex: TEX_GLOW,
        });
      }
    }
    // ---- integrity seeds
    if (!opts.noCollapse) {
      const sx = w.sx, sy = w.sy;
      const seedList: number[] = [];
      this.seeds.clear();
      for (let i = 0; i < n; i++) {
        const x = removedX[i], y = removedY[i], z = removedZ[i];
        for (let d = 0; d < 6; d++) {
          let nx = x, ny = y, nz = z;
          if (d === 0) nx--; else if (d === 1) nx++; else if (d === 2) ny--; else if (d === 3) ny++; else if (d === 4) nz--; else nz++;
          if (!w.inBounds(nx, ny, nz)) continue;
          if (!(mats.flags[w.get(nx, ny, nz)] & F_SOLID)) continue;
          const k = nx + sx * (ny + sy * nz);
          if (this.seeds.add(k)) seedList.push(k);
        }
      }
      this.pending.push({
        seeds: seedList,
        dir: opts.dir ? opts.dir.clone().multiplyScalar(impulse) : new THREE.Vector3(),
        cut: mode === 'cut',
        plane: mode === 'cut' && shape instanceof BoxShape ? slidePlaneOf(shape) : null,
      });
    }
    this.onCarve?.(shape.center, n, opts.mode);
    return { removed: n, mainMaterial: main };
  }

  private dustColor(m: number): THREE.Color {
    const def = this.world.mats.def(m);
    const c = new THREE.Color(def?.colors[Math.floor((def.colors.length - 1) / 2)] ?? '#888888');
    // dust is lighter and greyer than the material
    return c.lerp(new THREE.Color(0.62, 0.6, 0.57), 0.55);
  }

  /** Run the deferred integrity check and spawn falling fragments. Call once per frame. */
  update(): void {
    const batch = this.pending;
    this.pending = [];
    for (const p of batch) this.collapse(p.seeds, p.dir, p.cut, p.plane);
  }

  private collapse(seeds: number[], dir: THREE.Vector3, cut: boolean, plane: SlidePlane | null): void {
    if (seeds.length === 0) return;
    const comps = this.integrity.findFloating(seeds);
    const vs = this.world.vs;
    for (const comp of comps) {
      const vel = new THREE.Vector3();
      const ang = new THREE.Vector3();
      let slide: SlidePlane | undefined;
      if (cut) {
        // sliced parts slide along the cut, then topple
        const c = new THREE.Vector3((comp.minX + comp.maxX + 1) * 0.5 * vs, (comp.minY + comp.maxY + 1) * 0.5 * vs, (comp.minZ + comp.maxZ + 1) * 0.5 * vs);
        if (plane && c.clone().sub(plane.center).dot(plane.normal) > 0) {
          slide = plane;
          vel.copy(plane.downhill).multiplyScalar(1.6).addScaledVector(dir, 0.15);
        } else vel.copy(dir).multiplyScalar(0.3);
        ang.set((Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.15);
      } else {
        vel.copy(dir).multiplyScalar(0.25);
        ang.set((Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 1.2);
      }
      this.fragments.spawn(comp, { vel, angVel: ang, slide });
    }
  }
}

/** The cut plane of a thin box: normal = its thinnest axis (pointing up), used for smooth sliding. */
function slidePlaneOf(b: BoxShape): SlidePlane | null {
  const h = [b.half.x, b.half.y, b.half.z];
  const thin = h.indexOf(Math.min(...h));
  const axes = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)].map((v) => v.applyQuaternion(b.rot));
  const n = axes[thin].clone();
  if (n.y < 0) n.negate();
  if (n.y < 0.25) return null; // near-vertical cut: pieces simply fall
  const others = [0, 1, 2].filter((i) => i !== thin);
  const u = axes[others[0]], w = axes[others[1]];
  const g = new THREE.Vector3(0, -1, 0);
  const downhill = g.clone().addScaledVector(n, -g.dot(n));
  if (downhill.lengthSq() < 1e-6) downhill.set(1, 0, 0);
  downhill.normalize();
  // orientation whose local Y is the normal
  const m = new THREE.Matrix4().makeBasis(u, n, w.clone().crossVectors(u, n).normalize());
  const rot = new THREE.Quaternion().setFromRotationMatrix(m);
  return {
    center: b.center.clone().addScaledVector(n, -h[thin]),
    normal: n,
    downhill,
    rot,
    halfU: h[others[0]] * 1.5,
    halfW: h[others[1]] * 1.5,
  };
}
