// Momo Hinamori's effects (docs/kits/momo.md). Hadō #12 Fushibi: a web of fine threads strung between anchors on the
// ground and in the air, nearly invisible to anyone who did not lay it; a thread snares whoever walks into it, and fire
// touching it sets the whole web off, one strand after another outward from the spark. Bakudō #37 Tsuriboshi as a
// launch pad: a star of blue light under her feet. Bakudō #26 Kyokkō's shimmer. Hakufuku's purple blossoms.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { SphereShape } from '../destruction/shapes';
import { groundAt } from './iceArts';
import { AfterimagePool } from './afterimage';
import { TEX_GLOW, TEX_PUFF, TEX_RING, TEX_STREAK } from './sprites';

/** Tobiume's fire: a pale-gold core, an amber body, an orange-red rim */
export const TOBIUME_FIRE = { core: '#FFF3B0', shell: '#FFB33E', light: '#FF5A1F' };
export const MOMO_RED = { core: '#FFD6D0', body: '#E53935', rim: '#8E1F1F' };
const THREAD = new THREE.Color('#FF8A50');
const STAR = new THREE.Color('#4FA8FF');
const ROPE = new THREE.Color('#8CC8FF');
const HAKU = new THREE.Color('#9B6BD0');

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

interface Strand {
  a: number;
  b: number;
  lit: number;
}

/**
 * Hadō #12 Fushibi. `visibleTo` decides how plainly it shows (its maker sees it, everyone else barely). `ignite(at)`
 * sets it off from a spark: the strands blow up in order of distance from it.
 */
export class FushibiNet implements Projectile {
  done = false;
  readonly anchors: THREE.Vector3[] = [];
  readonly strands: Strand[] = [];
  private lines: THREE.LineSegments;
  private t = 0;
  private burning = false;
  private burnT = 0;
  private order: number[] = [];
  private blown = new Set<number>();
  private struck = new Set<number>();
  private snaredAt = new Map<number, number>();
  /** damage of the blast to each fighter caught in it (once per net) */
  blast = 80;
  /** `bright`: the threads are drawn plainly (its maker is the player) */
  constructor(private g: Game, readonly owner: Fighter, center: THREE.Vector3, radius: number, readonly life: number, private onSnare: (o: Fighter) => void, readonly bright: boolean) {
    // eight anchors: four on the ground round the centre, four in the air between them
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.random() * 0.3;
      const r = radius * (i % 2 ? 0.75 : 1);
      const x = center.x + Math.cos(a) * r, z = center.z + Math.sin(a) * r;
      const gy = groundAt(g, x, center.y + 2, z, 6) ?? center.y;
      this.anchors.push(new THREE.Vector3(x, gy + (i % 2 ? 1.0 + Math.random() * 0.8 : 0.08), z));
    }
    // the threads: round the ring, across it, and up to the air anchors
    for (let i = 0; i < 8; i++) this.strands.push({ a: i, b: (i + 1) % 8, lit: 0 });
    for (let i = 0; i < 4; i++) this.strands.push({ a: i, b: i + 4, lit: 0 });
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.strands.length * 6);
    this.strands.forEach((s, i) => {
      const a = this.anchors[s.a], b = this.anchors[s.b];
      pos.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6);
    });
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: THREAD.clone().multiplyScalar(bright ? 1.8 : 1.1), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.lines.frustumCulled = false;
    this.lines.renderOrder = 7;
    g.engine.gr.scene.add(this.lines);
  }

  /** the closest point of any thread to p, and its distance */
  nearest(p: THREE.Vector3): { d: number; strand: number } {
    let best = Infinity, bi = -1;
    this.strands.forEach((s, i) => {
      const d = segDist(p, this.anchors[s.a], this.anchors[s.b]);
      if (d < best) {
        best = d;
        bi = i;
      }
    });
    return { d: best, strand: bi };
  }

  /** where to send a spark from `from`: the nearest thread-post in the air (fire flung low would strike the ground) */
  aimPoint(from: THREE.Vector3): THREE.Vector3 {
    let best = this.anchors[1], bd = Infinity;
    for (let i = 1; i < this.anchors.length; i += 2) {
      const d = this.anchors[i].distanceToSquared(from);
      if (d < bd) {
        bd = d;
        best = this.anchors[i];
      }
    }
    return best.clone();
  }

  /** fire touched it at `at`: every strand blows, outward from the spark */
  ignite(at: THREE.Vector3): boolean {
    if (this.burning || this.done) return false;
    const n = this.nearest(at);
    if (n.d > 1.6) return false;
    this.burning = true;
    this.burnT = 0;
    const mid = (s: Strand) => _v.addVectors(this.anchors[s.a], this.anchors[s.b]).multiplyScalar(0.5);
    this.order = this.strands.map((_, i) => i).sort((i, j) => mid(this.strands[i]).distanceTo(at) - mid(this.strands[j]).distanceTo(at));
    this.g.callout('', 'FUSHIBI', '#FF8A50');
    return true;
  }

  get alight(): boolean {
    return this.burning;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.owner.dead && !this.burning) this.t = Math.max(this.t, this.life);
    if (this.burning) {
      this.burnT += dt;
      const due = Math.min(this.order.length, Math.floor(this.burnT / 0.05) + 1);
      for (let k = 0; k < due; k++) {
        const i = this.order[k];
        if (this.blown.has(i)) continue;
        this.blown.add(i);
        this.blow(i, g);
      }
      if (this.blown.size >= this.strands.length && this.burnT > this.order.length * 0.05 + 0.3) this.done = true;
      return;
    }
    if (this.t >= this.life) {
      this.done = true;
      return;
    }
    // a thread snares whoever walks into it (once the web has settled: whoever it was strung round has a moment)
    if (this.t < 0.5) return;
    for (const o of g.enemiesOf(this.owner)) {
      if (o.dead) continue;
      const last = this.snaredAt.get(o.id) ?? -10;
      if (this.t - last < 3) continue;
      const c = o.center(_w);
      const lo = _v.set(c.x, o.pos.y + 0.3, c.z);
      if (Math.min(this.nearest(c).d, this.nearest(lo).d) > o.def.radius + 0.12) continue;
      this.snaredAt.set(o.id, this.t);
      this.onSnare(o);
    }
  }

  /** one strand goes up: a run of fire along it, a blast at its middle */
  private blow(i: number, g: Game): void {
    const s = this.strands[i];
    const a = this.anchors[s.a], b = this.anchors[s.b];
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    const glow = g.engine.glow;
    for (let k = 0; k <= 6; k++) {
      const p = _v.lerpVectors(a, b, k / 6);
      glow.spawn({ x: p.x, y: p.y, z: p.z, vy: 1.5, size: 0.5, sizeEnd: 1.4, life: 0.4, r: 1, g: 0.55, b: 0.2, alpha: 0.9, alphaEnd: 0, tex: TEX_PUFF });
      glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.3, sizeEnd: 0.05, life: 0.2, r: 2, g: 1.6, b: 0.8, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    }
    g.engine.destruction.carve(new SphereShape(mid.clone(), 0.9, 0.8), { mode: 'explode', power: 220, impulse: 8 });
    g.sfx.play('explode', mid, 0.7);
    g.addRing(mid.clone(), 2.6, '#FF8A50', 0.35);
    for (const o of g.enemiesOf(this.owner)) {
      if (o.dead || this.struck.has(o.id)) continue;
      if (segDist(o.center(_w), a, b) > o.def.radius + 1.3) continue;
      this.struck.add(o.id);
      g.damage(o, this.blast, this.owner, _w.subVectors(o.pos, mid).setY(0).normalize().clone(), { energy: true, knock: 8, launch: 3, heavy: true, hitstop: 0.06, shake: 0.35 });
    }
  }

  render(): void {
    const m = this.lines.material as THREE.LineBasicMaterial;
    const fadeIn = Math.min(1, this.t / 0.4), fadeOut = Math.min(1, (this.life - this.t) / 1);
    // laid: it shimmers once, then sinks almost out of sight
    const base = this.bright ? 0.35 : 0.08;
    const flash = Math.max(0, 1 - this.t / 0.6);
    m.opacity = this.burning ? Math.max(0, 1 - this.burnT * 1.2) : Math.max(0, (base + flash * 0.6) * fadeIn * fadeOut);
  }

  dispose(): void {
    this.lines.removeFromParent();
    this.lines.geometry.dispose();
    (this.lines.material as THREE.Material).dispose();
  }
}

function segDist(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3): number {
  const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z;
  const l2 = abx * abx + aby * aby + abz * abz || 1e-6;
  const k = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby + (p.z - a.z) * abz) / l2));
  return Math.hypot(p.x - (a.x + abx * k), p.y - (a.y + aby * k), p.z - (a.z + abz * k));
}

/** the threads' snare: a few hot threads round the one caught */
export function snareFlash(g: Game, o: Fighter): void {
  const c = o.center(_v);
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2;
    g.engine.glow.spawn({ x: c.x + Math.cos(a) * 0.5, y: o.pos.y + Math.random() * o.def.height, z: c.z + Math.sin(a) * 0.5, vx: -Math.sin(a) * 2, vz: Math.cos(a) * 2, size: 0.08, sizeEnd: 0.02, life: 0.5, r: THREAD.r * 2, g: THREAD.g * 2, b: THREAD.b * 2, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
  }
}

// ------------------------------------------------------------------ Tsuriboshi under her feet

/** Bakudō #37 Tsuriboshi laid flat under her: a five-pointed star of blue light on six ropes, flashing and gone. */
export class StarNet implements Projectile {
  done = false;
  private t = 0;
  private lines: THREE.LineSegments;
  constructor(g: Game, private at: THREE.Vector3) {
    const pts: number[] = [];
    const R = 1.3, r = 0.55;
    const star: THREE.Vector3[] = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 ? r : R;
      star.push(new THREE.Vector3(at.x + Math.cos(a) * rr, at.y + 0.1, at.z + Math.sin(a) * rr));
    }
    for (let i = 0; i < 10; i++) pts.push(...star[i].toArray(), ...star[(i + 1) % 10].toArray());
    // the six ropes off to anchor posts round it
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      pts.push(at.x, at.y + 0.1, at.z, at.x + Math.cos(a) * 2.4, at.y + 0.3, at.z + Math.sin(a) * 2.4);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: STAR.clone().multiplyScalar(2.2), transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.lines.frustumCulled = false;
    g.engine.gr.scene.add(this.lines);
    g.engine.glow.spawn({ x: at.x, y: at.y + 0.1, z: at.z, size: 1, sizeEnd: 3, life: 0.4, r: ROPE.r * 1.6, g: ROPE.g * 1.6, b: ROPE.b * 2, alpha: 0.8, alphaEnd: 0, tex: TEX_RING });
  }
  update(dt: number): void {
    this.t += dt;
    if (this.t > 0.7) this.done = true;
  }
  render(): void {
    (this.lines.material as THREE.LineBasicMaterial).opacity = Math.max(0, 1 - this.t / 0.7);
    this.lines.position.y = -Math.sin(Math.min(1, this.t / 0.25) * Math.PI) * 0.25;
  }
  dispose(): void {
    this.lines.removeFromParent();
    this.lines.geometry.dispose();
    (this.lines.material as THREE.Material).dispose();
  }
}

/**
 * Bakudō #26 Kyokkō: light bent round her. The kit hides her body; this leaves the faint refraction where she
 * moves (a pale ghost of her pose every few frames, a glint now and then) until `lift()`.
 */
export class KyokkoVeil implements Projectile {
  done = false;
  private pool: AfterimagePool;
  private t = 0;
  private next = 0;
  private liftedAt = -1;
  constructor(private g: Game, private f: Fighter) {
    this.pool = new AfterimagePool(f.visual, 5);
    this.pool.color.set('#BCD4FF');
    g.engine.gr.scene.add(this.pool.group);
  }
  lift(): void {
    if (this.liftedAt < 0) this.liftedAt = this.t;
  }
  update(dt: number): void {
    this.t += dt;
    if (this.f.dead) this.lift();
    if (this.liftedAt < 0 && this.t >= this.next) {
      this.next = this.t + 0.14;
      this.pool.spawn(0.32, 0.07);
      kyokkoShimmer(this.g, this.f, 0.6);
    }
    if (this.liftedAt >= 0 && this.t > this.liftedAt + 0.4) this.done = true;
  }
  render(dt: number, time: number): void {
    this.pool.update(dt, time);
  }
  dispose(): void {
    this.pool.group.removeFromParent();
  }
}

/** Kyokkō's shimmer: faint refraction where she is hidden (one frame's worth) */
export function kyokkoShimmer(g: Game, f: Fighter, k = 1): void {
  if (Math.random() > 0.35 * k) return;
  const p = f.pos;
  g.engine.glow.spawn({ x: p.x + (Math.random() - 0.5) * 0.5, y: p.y + Math.random() * f.def.height, z: p.z + (Math.random() - 0.5) * 0.5, vy: 0.4, size: 0.35, sizeEnd: 0.5, life: 0.35, r: 0.7, g: 0.8, b: 1, alpha: 0.12, alphaEnd: 0, tex: TEX_GLOW });
}

/** Hakufuku: purple blossoms bursting in front of her palm */
export function hakufukuBloom(g: Game, at: THREE.Vector3, dir: THREE.Vector3): void {
  for (let i = 0; i < 26; i++) {
    const s = 2 + Math.random() * 3;
    g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, vx: dir.x * s + (Math.random() - 0.5) * 3, vy: (Math.random() - 0.3) * 2, vz: dir.z * s + (Math.random() - 0.5) * 3, size: 0.18, sizeEnd: 0.36, life: 0.9, r: HAKU.r * 1.6, g: HAKU.g * 1.6, b: HAKU.b * 1.8, alpha: 0.9, alphaEnd: 0, tex: TEX_PUFF, drag: 2.5 });
  }
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: 0.5, sizeEnd: 2, life: 0.4, r: HAKU.r * 2, g: HAKU.g * 2, b: HAKU.b * 2.2, alpha: 0.8, alphaEnd: 0, tex: TEX_RING });
}
