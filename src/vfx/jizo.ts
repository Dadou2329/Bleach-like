// Mayuri's toys and his Bankai. Jabarakaina: the left arm shoots out as a segmented snake-belly limb, seizes
// what it reaches and hauls it in. The explosive membrane: a disc that sticks where it lands and blows. The
// sleeve net: sticky strands sprayed out that bind. The silent palm Kidō: a white bolt that bores through
// walls. Poison: a creeping violet gas that eats whoever is not of his blood (the Shikai's vapour, the
// Bankai's breath). Konjiki Ashisogi Jizō: the 17 m creature, undulating on its segments, that crawls after
// the enemy, breathes the poison, springs blades from its chest, charges, devours, and blows itself apart.
// Nikushibuki: the puddle he becomes.
import * as THREE from 'three';
import type { Fighter } from '../game/fighter';
import type { DamageOpts, Game, Projectile } from '../game/game';
import { CharacterVisual } from '../game/characterFactory';
import { JIZO_SEGMENTS, jizoAsset } from '../chars/mayuriBankai';
import { BoxShape, CapsuleShape, SphereShape } from '../destruction/shapes';
import { raycastVoxels } from '../voxel/raycast';
import { groundAt } from './iceArts';
import { TEX_GLOW, TEX_PUFF, TEX_RING, TEX_STREAK } from './sprites';

export const POISON = new THREE.Color('#8E5CC0');
export const POISON_DARK = new THREE.Color('#5B3A86');
export const MAYURI_PINK = new THREE.Color('#F28FC0');
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const UP = new THREE.Vector3(0, 1, 0);

function socket(f: Fighter, name: string, out = new THREE.Vector3()): THREE.Vector3 {
  const s = f.visual.rig.sockets.get(name);
  if (!s) return f.center(out);
  s.updateWorldMatrix(true, false);
  return s.getWorldPosition(out);
}

// ------------------------------------------------------------------ Jabarakaina

const SEG = 0.34;

/**
 * Jabarakaina: the left arm shot out as a chain of white segments toward a point; it seizes the first enemy
 * it reaches and hauls them in to him (or slams into a wall), then reels back in.
 */
export class Jabarakaina implements Projectile {
  done = false;
  private t = 0;
  private len = 0;
  private state: 'out' | 'haul' | 'back' = 'out';
  private mesh: THREE.InstancedMesh;
  private claw: THREE.Mesh;
  readonly tip = new THREE.Vector3();
  private dir = new THREE.Vector3();
  caught: Fighter | null = null;
  private maxLen: number;

  constructor(private g: Game, readonly owner: Fighter, aim: THREE.Vector3, readonly o: { range: number; damage: number; onCatch?: (f: Fighter) => void }) {
    const from = socket(owner, 'shoulder.L');
    this.dir.subVectors(aim, from).normalize();
    this.maxLen = o.range;
    const hit = raycastVoxels(g.engine.world, from.x, from.y, from.z, this.dir.x, this.dir.y, this.dir.z, o.range);
    if (hit) this.maxLen = Math.max(1, hit.dist);
    const geo = new THREE.CylinderGeometry(0.075, 0.085, SEG * 0.92, 8);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({ color: '#E9E6DE', roughness: 0.55 });
    this.mesh = new THREE.InstancedMesh(geo, mat, 64);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = true;
    // the hand at the end: long white fingers spread like a claw
    const cg = new THREE.ConeGeometry(0.16, 0.36, 5);
    cg.rotateX(Math.PI / 2);
    this.claw = new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ color: '#E9E6DE', roughness: 0.5 }));
    g.engine.gr.scene.add(this.mesh, this.claw);
    g.sfx.play('swingHeavy', from, 0.7);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const from = socket(this.owner, 'shoulder.L', _w);
    if (this.state === 'out') {
      this.len = Math.min(this.maxLen, this.len + 42 * dt);
      this.tip.copy(from).addScaledVector(this.dir, this.len);
      for (const e of g.enemiesOf(this.owner)) {
        const cy = Math.max(e.pos.y + 0.2, Math.min(e.pos.y + e.def.height - 0.2, this.tip.y));
        if (Math.hypot(this.tip.x - e.pos.x, this.tip.y - cy, this.tip.z - e.pos.z) > e.def.radius + 0.35) continue;
        this.caught = e;
        this.state = 'haul';
        g.damage(e, this.o.damage, this.owner, this.dir.clone().negate(), { knock: 0, hitstop: 0.06, shake: 0.2 });
        e.hitstun = Math.max(e.hitstun, 0.9);
        g.sparks(this.tip.clone(), this.dir.clone().negate(), '#F3F2EC', 8);
        this.o.onCatch?.(e);
        break;
      }
      if (this.state === 'out' && this.len >= this.maxLen - 0.01) {
        if (this.maxLen < this.o.range - 0.1) {
          // it struck a wall: the claw bites in
          g.engine.destruction.carve(new SphereShape(this.tip.clone(), 0.5), { mode: 'smash', power: 120, debris: 0.4 });
        }
        this.state = 'back';
      }
    } else if (this.state === 'haul') {
      this.len = Math.max(0.6, this.len - 18 * dt);
      this.tip.copy(from).addScaledVector(this.dir, this.len);
      const e = this.caught;
      if (e && !e.dead) {
        // drag the caught one along with the hand
        _v.set(this.tip.x, Math.max(e.pos.y, this.tip.y - e.def.height * 0.55), this.tip.z);
        e.body.pos.lerp(_v, 0.5);
        e.body.vel.set(0, Math.min(0, e.body.vel.y), 0);
        e.hitstun = Math.max(e.hitstun, 0.25);
      }
      if (this.len <= 1.2 || !e || e.dead) this.state = 'back';
    } else {
      this.len = Math.max(0, this.len - 30 * dt);
      this.tip.copy(from).addScaledVector(this.dir, this.len);
      if (this.len <= 0.05) this.done = true;
    }
    if (this.t > 3) this.done = true;
  }

  render(): void {
    const from = socket(this.owner, 'shoulder.L', _w);
    const n = Math.min(64, Math.max(1, Math.round(this.len / SEG)));
    const m = new THREE.Matrix4();
    _q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.dir);
    // a slight snaking wave along the arm while it flies
    const side = _v.crossVectors(this.dir, UP).normalize();
    for (let i = 0; i < n; i++) {
      const k = (i + 0.5) / n;
      const p = from.clone().addScaledVector(this.dir, this.len * k);
      p.addScaledVector(side, Math.sin(k * 9 - this.t * 30) * 0.06 * (this.state === 'out' ? 1 : 0.3));
      m.compose(p, _q, new THREE.Vector3(1, 1, (this.len / n) / SEG));
      this.mesh.setMatrixAt(i, m);
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.claw.position.copy(this.tip);
    this.claw.quaternion.copy(_q);
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.claw.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.claw.geometry.dispose();
    (this.claw.material as THREE.Material).dispose();
  }
}

// ------------------------------------------------------------------ the explosive membrane

/** A round membrane flung at the enemy: it sticks to whatever it lands on and blows a second later. */
export class Membrane implements Projectile {
  done = false;
  private t = 0;
  readonly pos = new THREE.Vector3();
  private vel = new THREE.Vector3();
  private stuck: Fighter | null = null;
  private stuckOff = new THREE.Vector3();
  private landed = false;
  private fuse = 0;
  private mesh: THREE.Mesh;

  constructor(private g: Game, readonly owner: Fighter, from: THREE.Vector3, aim: THREE.Vector3, readonly o: { damage: number; radius: number }) {
    this.pos.copy(from);
    const d = _v.subVectors(aim, from);
    const flat = Math.hypot(d.x, d.z);
    const T = Math.max(0.25, flat / 22);
    this.vel.set(d.x / T, d.y / T + 0.5 * 12 * T, d.z / T);
    const geo = new THREE.CylinderGeometry(0.28, 0.28, 0.05, 14);
    this.mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#C9B5D6', roughness: 0.4, emissive: new THREE.Color('#F28FC0'), emissiveIntensity: 0.4 }));
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.stuck) {
      this.pos.copy(this.stuck.pos).add(this.stuckOff);
      this.fuse += dt;
    } else if (this.landed) this.fuse += dt;
    else {
      this.vel.y -= 12 * dt;
      const prev = this.pos.clone();
      this.pos.addScaledVector(this.vel, dt);
      for (const e of g.enemiesOf(this.owner)) {
        const cy = Math.max(e.pos.y, Math.min(e.pos.y + e.def.height, this.pos.y));
        if (Math.hypot(this.pos.x - e.pos.x, this.pos.y - cy, this.pos.z - e.pos.z) > e.def.radius + 0.3) continue;
        this.stuck = e;
        this.stuckOff.subVectors(this.pos, e.pos);
        g.sfx.play('ting', this.pos, 0.6);
        break;
      }
      const seg = _v.subVectors(this.pos, prev);
      const hit = !this.stuck && raycastVoxels(g.engine.world, prev.x, prev.y, prev.z, seg.x, seg.y, seg.z, seg.length() + 0.05);
      if (hit) {
        this.pos.copy(prev).addScaledVector(seg.normalize(), hit.dist);
        this.landed = true;
      }
    }
    if (this.fuse > 1.0 || this.t > 5) this.blow(g);
  }

  private blow(g: Game): void {
    if (this.done) return;
    this.done = true;
    const p = this.pos;
    g.engine.destruction.carve(new SphereShape(p.clone(), this.o.radius * 0.6), { mode: 'explode', power: 260, impulse: 12 });
    g.sfx.play('explode', p, 0.9);
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: this.o.radius * 2, sizeEnd: 0.3, life: 0.3, r: 2.6, g: 1.4, b: 1.8, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    g.addRing(p.clone(), this.o.radius * 1.4, '#F28FC0', 0.35);
    for (const e of g.enemiesOf(this.owner)) {
      _v.subVectors(e.center(_w), p);
      const d = _v.length();
      if (d > this.o.radius + e.def.radius) continue;
      g.damage(e, this.o.damage * (1 - (d / (this.o.radius + 1)) * 0.5) * (e === this.stuck ? 1.4 : 1), this.owner, _v.setY(0).normalize().clone(), { knock: 14, launch: 5, heavy: true, hitstop: 0.1, shake: 0.4 });
    }
  }

  render(): void {
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.set(this.t * 14, this.t * 9, 0);
    const blink = this.fuse > 0 && Math.floor(this.fuse * (6 + this.fuse * 14)) % 2 === 0;
    (this.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = blink ? 3 : 0.4;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

// ------------------------------------------------------------------ the sleeve net

/** The sleeve net: sticky white strands sprayed out in a cone; whoever they reach is bound in place a while. */
export class SleeveNet implements Projectile {
  done = false;
  private t = 0;
  private lines: THREE.LineSegments;
  private bound = new Map<number, Fighter>();
  private ends: THREE.Vector3[] = [];
  private from = new THREE.Vector3();

  constructor(private g: Game, readonly owner: Fighter, dir: THREE.Vector3, readonly o: { range: number; spread: number; hold: number }) {
    this.from.copy(owner.center()).addScaledVector(dir, 0.5);
    const n = 28;
    const side = new THREE.Vector3(dir.z, 0, -dir.x).normalize();
    for (let i = 0; i < n; i++) {
      const a = (Math.random() - 0.5) * o.spread * 2, e = (Math.random() - 0.4) * o.spread;
      const d = dir.clone().applyAxisAngle(UP, a).addScaledVector(UP, e).normalize();
      this.ends.push(d.multiplyScalar(o.range * (0.6 + Math.random() * 0.4)));
      void side;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 2 * 3), 3));
    this.lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#F3F2EC', transparent: true, opacity: 0.9 }));
    this.lines.frustumCulled = false;
    g.engine.gr.scene.add(this.lines);
    // whoever stands in the cone is caught in the strands
    const cosA = Math.cos(o.spread);
    for (const e of g.enemiesOf(owner)) {
      _v.subVectors(e.center(_w), this.from);
      const d = _v.length();
      if (d > o.range + e.def.radius) continue;
      if (_v.normalize().dot(dir) < cosA) continue;
      this.bound.set(e.id, e);
      e.slow(0.9, o.hold);
      e.hitstun = Math.max(e.hitstun, 0.5);
      g.damage(e, 6, owner, dir.clone(), { knock: 0, quiet: true });
    }
    g.sfx.play('swing', this.from, 0.8);
  }

  update(dt: number): void {
    this.t += dt;
    if (this.t > this.o.hold + 0.4) this.done = true;
  }

  render(): void {
    const reach = Math.min(1, this.t / 0.18);
    const a = this.lines.geometry.getAttribute('position') as THREE.BufferAttribute;
    this.ends.forEach((e, i) => {
      a.setXYZ(i * 2, this.from.x, this.from.y, this.from.z);
      a.setXYZ(i * 2 + 1, this.from.x + e.x * reach, this.from.y + e.y * reach - this.t * 0.2, this.from.z + e.z * reach);
    });
    a.needsUpdate = true;
    (this.lines.material as THREE.LineBasicMaterial).opacity = Math.max(0, 0.9 - Math.max(0, this.t - this.o.hold) * 2.2);
  }

  dispose(): void {
    this.lines.removeFromParent();
    this.lines.geometry.dispose();
    (this.lines.material as THREE.Material).dispose();
  }
}

// ------------------------------------------------------------------ the silent palm Kidō

/** The silent Kidō from his palm: a thin white bolt along a line, boring through walls and whoever stands there. */
export function palmBolt(g: Game, owner: Fighter, from: THREE.Vector3, dir: THREE.Vector3, o: { range: number; damage: number; power: number }): void {
  const to = from.clone().addScaledVector(dir, o.range);
  g.engine.destruction.carve(new CapsuleShape(from.clone().addScaledVector(dir, 0.6), to, 0.45), { mode: 'bore', power: o.power, sparks: [2.4, 1.4, 1.9] });
  for (const e of g.enemiesOf(owner)) {
    const c = e.center(_v);
    const along = _w.subVectors(c, from).dot(dir);
    if (along < 0 || along > o.range) continue;
    const off = _w.subVectors(c, from).addScaledVector(dir, -along).length();
    if (off > e.def.radius + 0.5) continue;
    g.damage(e, o.damage, owner, dir.clone(), { knock: 10, launch: 2, energy: true, hitstop: 0.06, shake: 0.2 });
  }
  for (let i = 0; i < 26; i++) {
    const k = Math.random();
    const p = from.clone().lerp(to, k);
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: dir.x * 30, vy: dir.y * 30, vz: dir.z * 30, size: 0.2, sizeEnd: 0.04, life: 0.18 + Math.random() * 0.15, r: 2.6, g: 2.2, b: 2.6, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
  }
  g.engine.glow.spawn({ x: from.x, y: from.y, z: from.z, size: 1, sizeEnd: 0.2, life: 0.2, r: 2.6, g: 2.4, b: 2.6, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  g.sfx.play('beam', from, 0.6);
}

// ------------------------------------------------------------------ poison

/**
 * A poison cloud: violet gas creeping out from a point (or blown along a direction) to a radius; whoever is
 * inside and not of his blood is eaten away (damage over time, slowed). The cloud drifts and thins.
 */
export class PoisonCloud implements Projectile {
  done = false;
  private t = 0;
  private acc = 0;
  private tick = 0;
  readonly center: THREE.Vector3;

  constructor(private g: Game, readonly owner: Fighter, center: THREE.Vector3, readonly o: { radius: number; grow: number; dur: number; dps: number; dir?: THREE.Vector3; immune?: (f: Fighter) => boolean }) {
    this.center = center.clone();
  }

  /** the radius the gas has reached */
  get reach(): number {
    return this.o.radius * Math.min(1, this.t / this.o.grow);
  }

  inside(p: THREE.Vector3): boolean {
    _v.subVectors(p, this.center);
    return Math.hypot(_v.x, _v.z) < this.reach && _v.y > -2 && _v.y < this.reach * 0.6 + 2;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.o.dir) this.center.addScaledVector(this.o.dir, dt * 1.2);
    const fade = Math.max(0, Math.min(1, (this.o.dur - this.t) / 1.5));
    if (this.t > this.o.dur) {
      this.done = true;
      return;
    }
    // the gas: puffs filling the reach, thicker near the ground
    this.acc += dt * (14 + this.o.radius * 2.2) * fade;
    while (this.acc > 1) {
      this.acc -= 1;
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * this.reach;
      const c = Math.random() < 0.5 ? POISON : POISON_DARK;
      const x = this.center.x + Math.cos(a) * r, z = this.center.z + Math.sin(a) * r;
      const gy = groundAt(g, x, this.center.y + 3, z, 8) ?? this.center.y;
      g.engine.dust.spawn({ x, y: gy + 0.3 + Math.random() * 1.6, z, vx: (Math.random() - 0.5) * 0.8, vy: 0.15 + Math.random() * 0.3, vz: (Math.random() - 0.5) * 0.8, size: 1.4 + Math.random() * 1.6, sizeEnd: 3 + Math.random() * 2.5, life: 1.6 + Math.random() * 1.4, r: c.r * 0.9, g: c.g * 0.9, b: c.b * 0.9, alpha: 0.42, alphaEnd: 0, drag: 0.6, tex: TEX_PUFF });
    }
    // it eats whoever is inside
    this.tick += dt;
    if (this.tick >= 0.25) {
      this.tick = 0;
      for (const e of g.fighters) {
        if (e.dead || e === this.owner || e.team === this.owner.team || this.o.immune?.(e)) continue;
        if (!this.inside(e.center(_w))) continue;
        g.drain(e, this.o.dps * 0.25 * fade, this.owner);
        e.slow(0.35, 0.4);
        if (Math.random() < 0.3) g.engine.glow.spawn({ x: e.pos.x, y: e.pos.y + 1.2, z: e.pos.z, vy: 0.8, size: 0.35, sizeEnd: 0.05, life: 0.6, r: 1.2, g: 0.6, b: 1.6, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW });
      }
    }
  }

  dispose(): void {}
}

// ------------------------------------------------------------------ Kyōdo Yon

/**
 * Ashisogi Jizō, Kyōdo Yon: the baby screams. Whoever hears it four seconds without a break — inside the
 * radius the whole time — is paralysed through and through.
 */
export class KyodoYon implements Projectile {
  done = false;
  private t = 0;
  private heard = new Map<number, number>();
  private ringT = 0;

  constructor(private g: Game, readonly owner: Fighter, readonly at: () => THREE.Vector3, readonly o: { radius: number; dur: number; need: number; paralyse: number; onParalyse?: (f: Fighter) => void }) {
    g.sfx.play('roar', at(), 0.9);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const c = this.at();
    this.ringT -= dt;
    if (this.ringT <= 0) {
      this.ringT = 0.28;
      g.addRing(c.clone(), this.o.radius * 0.7, '#B03A6A', 0.6);
      g.sfx.play('crack', c, 0.25);
    }
    if (Math.random() < 0.6) g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, vz: (Math.random() - 0.5) * 4, size: 0.4, sizeEnd: 1.4, life: 0.4, r: 1.4, g: 0.3, b: 0.8, alpha: 0.6, alphaEnd: 0, tex: TEX_RING });
    for (const e of g.enemiesOf(this.owner)) {
      const inside = e.center(_v).distanceTo(c) < this.o.radius + e.def.radius;
      const h = inside ? (this.heard.get(e.id) ?? 0) + dt : 0;
      this.heard.set(e.id, h);
      if (inside) e.slow(0.25 + Math.min(0.5, h / this.o.need * 0.5), 0.3);
      if (h >= this.o.need) {
        this.heard.set(e.id, -1e9);
        e.stopAction();
        e.hitstun = Math.max(e.hitstun, this.o.paralyse);
        e.slow(0.95, this.o.paralyse);
        this.o.onParalyse?.(e);
        g.engine.glow.spawn({ x: e.pos.x, y: e.pos.y + 1, z: e.pos.z, size: 2.4, sizeEnd: 0.4, life: 0.5, r: 1.6, g: 0.4, b: 1, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
      }
    }
    if (this.t > this.o.dur) this.done = true;
  }

  dispose(): void {}
}

// ------------------------------------------------------------------ Konjiki Ashisogi Jizō

export type JizoOrder = 'idle' | 'breath' | 'blades' | 'charge' | 'devour';

/**
 * The Bankai: the creature born out of the baby's mouth on the trident. It rises out of the ground ahead of
 * him, then crawls after the enemy (keeping a little off), its segments rolling in a wave; orders come from
 * the kit. It is not hurt by blows (it is a Bankai): it ends when he dismisses it, runs dry, or blows it up.
 */
export class KonjikiJizo implements Projectile {
  done = false;
  private t = 0;
  readonly v: CharacterVisual;
  readonly pos = new THREE.Vector3();
  yaw = 0;
  private bones: Record<string, number> = {};
  order: JizoOrder = 'idle';
  private orderT = 0;
  private endT = -1;
  private rise = 0;
  private crawl = 0;
  private hits = new Set<number>();
  private target: Fighter | null = null;
  private devoured: Fighter | null = null;
  private onDevourHit: ((f: Fighter) => void) | null = null;

  constructor(private g: Game, readonly owner: Fighter, at: THREE.Vector3, yaw: number) {
    const a = jizoAsset();
    this.v = new CharacterVisual(a.model, [], []);
    this.pos.copy(at);
    this.yaw = yaw;
    for (const n of ['root', 'head', 'halo', 'arm.L', 'arm.R', 'hand.L', 'hand.R', 'blades', ...Array.from({ length: JIZO_SEGMENTS }, (_, i) => `seg${i + 1}`)]) this.bones[n] = this.v.rig.index(n);
    this.v.rig.setBoneVisible('blades', false);
    this.v.forEachMaterial((m) => m.userData.uniforms.uRim.value.set(1, 0.2, 0.25, 0.6));
    g.engine.gr.scene.add(this.v.object);
    g.sfx.play('roarBig', at, 1.2);
  }

  get alive(): boolean {
    return this.endT < 0;
  }

  /** where the mouth is, in the world */
  mouth(out = new THREE.Vector3()): THREE.Vector3 {
    const s = this.v.rig.sockets.get('mouth');
    if (!s) return out.copy(this.pos);
    s.updateWorldMatrix(true, false);
    return s.getWorldPosition(out);
  }

  forward(out = new THREE.Vector3()): THREE.Vector3 {
    return out.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
  }

  command(order: JizoOrder, target: Fighter | null, onDevour?: (f: Fighter) => void): void {
    if (!this.alive) return;
    this.order = order;
    this.orderT = 0;
    this.target = target;
    this.hits.clear();
    this.onDevourHit = onDevour ?? null;
    this.v.rig.setBoneVisible('blades', order === 'blades');
  }

  dismiss(): void {
    if (this.endT < 0) this.endT = 0;
    if (this.devoured) this.spit();
  }

  private spit(): void {
    const e = this.devoured;
    this.devoured = null;
    if (!e || e.dead) return;
    const fw = this.forward(_v);
    e.body.pos.copy(this.mouth(_w)).addScaledVector(fw, 1.5);
    e.body.prev.copy(e.body.pos);
    e.visual.object.visible = true;
    e.push.addScaledVector(fw, 14);
    e.body.vel.y = 6;
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    this.orderT += dt;
    this.rise = Math.min(1, this.t / 1.4);
    if (this.endT >= 0) {
      this.endT += dt;
      if (this.endT > 1.2) this.done = true;
      return;
    }
    if (this.owner.dead) this.dismiss();
    const tgt = this.target && !this.target.dead ? this.target : g.nearestEnemy(this.owner, 80);
    const fw = this.forward(_v);
    // turn toward the target and crawl after it, keeping ~9 m off (charging closes in)
    if (tgt && this.rise >= 1) {
      const dx = tgt.pos.x - this.pos.x, dz = tgt.pos.z - this.pos.z;
      const want = Math.atan2(dx, dz);
      let dy = want - this.yaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      this.yaw += dy * Math.min(1, dt * (this.order === 'charge' || this.order === 'devour' ? 4 : 1.4));
      const d = Math.hypot(dx, dz);
      // devouring: it lunges until the mouth is on the target
      const lunge = this.order === 'devour' && !this.devoured && this.orderT < 0.8 && this.mouth(_w).distanceTo(tgt.center(new THREE.Vector3())) > 3 ? 18 : 0;
      const speed = this.order === 'charge' ? 16 : this.order === 'idle' ? (d > 11 ? 3.2 : d < 7 ? -1.5 : 0) : lunge;
      if (speed !== 0) {
        this.pos.addScaledVector(fw, speed * dt);
        this.crawl += Math.abs(speed) * dt;
      }
    }
    const gy = groundAt(g, this.pos.x, this.pos.y + 4, this.pos.z, 10);
    if (gy !== null) this.pos.y += (gy - this.pos.y) * Math.min(1, dt * 6);
    // ---- orders
    const o = this.order;
    if (o === 'charge') {
      // it crushes what it crawls over and whoever it runs down
      if (Math.floor(this.orderT * 7) !== Math.floor((this.orderT - dt) * 7)) {
        const front = this.pos.clone().addScaledVector(fw, 2).setY(this.pos.y + 1.6);
        g.engine.destruction.carve(new SphereShape(front, 2.7, 0.7), { mode: 'smash', power: 420, impulse: 10, dust: 1.4 });
      }
      for (const e of g.enemiesOf(this.owner)) {
        if (this.hits.has(e.id)) continue;
        _w.subVectors(e.pos, this.pos);
        const along = _w.dot(fw);
        const off = Math.abs(_w.x * fw.z - _w.z * fw.x);
        if (along < -3 || along > 5 || off > 4.5) continue;
        this.hits.add(e.id);
        g.damage(e, 70, this.owner, fw.clone(), { knock: 24, launch: 8, heavy: true, hitstop: 0.14, shake: 0.6 });
      }
      if (this.orderT > 1.4) this.command('idle', null);
    } else if (o === 'blades') {
      if (this.orderT > 0.25 && this.orderT < 0.75) {
        const chest = this.pos.clone().addScaledVector(fw, 3.5).setY(this.pos.y + 0.8);
        for (const e of g.enemiesOf(this.owner)) {
          if (this.hits.has(e.id)) continue;
          if (e.pos.distanceTo(chest) > 6.5 + e.def.radius) continue;
          this.hits.add(e.id);
          g.damage(e, 58, this.owner, _w.subVectors(e.pos, this.pos).setY(0).normalize().clone(), { knock: 12, launch: 6, heavy: true, hitstop: 0.12, shake: 0.5 });
          g.sparks(e.center(), fw.clone(), '#C9CED4', 16);
        }
        if (Math.floor(this.orderT * 20) % 2 === 0) g.engine.destruction.carve(new SphereShape(chest.clone().addScaledVector(fw, 2 + Math.random() * 3), 1.2), { mode: 'cut', power: 600, sparks: [1.2, 1.2, 1.3] });
      }
      if (this.orderT > 1.0) this.command('idle', null);
    } else if (o === 'devour') {
      const m = this.mouth(_w);
      if (!this.devoured && this.orderT < 0.8 && tgt && tgt.center(new THREE.Vector3()).distanceTo(m) < 5.5) {
        this.devoured = tgt;
        tgt.stopAction();
        this.onDevourHit?.(tgt);
        g.sfx.play('hitHeavy', m, 1.2);
      }
      if (this.devoured) {
        const e = this.devoured;
        e.hitstun = Math.max(e.hitstun, 0.3);
        e.body.pos.copy(m).setY(m.y - 0.8);
        e.body.prev.copy(e.body.pos);
        e.body.vel.set(0, 0, 0);
        e.visual.object.visible = false;
        if (Math.floor(this.orderT * 4) !== Math.floor((this.orderT - dt) * 4)) g.damage(e, 22, this.owner, fw.clone(), { knock: 0, quiet: true });
        if (this.orderT > 1.8) {
          this.spit();
          this.command('idle', null);
        }
      } else if (this.orderT > 1.0) this.command('idle', null);
    } else if (o === 'breath') {
      if (this.orderT > 1.6) this.command('idle', null);
    }
  }

  /** the poison breath: the gas pours out of the mouth over everything ahead (the kit makes the cloud) */
  breathPoint(out = new THREE.Vector3()): THREE.Vector3 {
    return this.mouth(out);
  }

  /** blow itself apart (the self-destruct protocol) */
  explode(onBlast: (at: THREE.Vector3) => void): void {
    if (this.endT >= 0) return;
    const at = this.pos.clone().setY(this.pos.y + 3);
    onBlast(at);
    this.dismiss();
    this.v.object.visible = false;
  }

  render(dt: number): void {
    const o = this.v.object;
    // rising out of the ground; sinking back when dismissed
    const sink = this.endT >= 0 ? Math.min(1, this.endT / 1.1) : 0;
    o.position.copy(this.pos);
    o.position.y -= (1 - this.rise) * 7 + sink * 8;
    o.rotation.set(0, this.yaw, 0);
    const B = this.bones;
    const rig = this.v.rig;
    const set = (n: string, x: number, y: number, z: number) => {
      const i = B[n];
      if (i === undefined || i < 0) return;
      rig.bones[i].quaternion.setFromEuler(_e.set(x, y, z));
    };
    const t = this.t;
    // the crawl: a wave rolling back along the segments, a sway from side to side
    const ph = this.crawl * 1.4 + t * 1.2;
    for (let i = 1; i <= JIZO_SEGMENTS; i++) set(`seg${i}`, Math.sin(ph - i * 0.9) * 0.07, Math.sin(t * 0.6 - i * 0.5) * 0.06, 0);
    // the head: bobbing; thrown back to breathe, lunging to devour
    const ord = this.order, ot = this.orderT;
    let hx = Math.sin(t * 1.5) * 0.06, hy = Math.sin(t * 0.7) * 0.08;
    if (ord === 'breath') hx = ot < 0.4 ? -0.35 * (ot / 0.4) : -0.35 + Math.min(0.6, (ot - 0.4) * 2.4);
    if (ord === 'devour') hx = ot < 0.3 ? 0.4 * (ot / 0.3) : 0.4;
    set('head', hx, hy, Math.sin(t * 0.9) * 0.05);
    set('halo', Math.sin(t * 2) * 0.05, t * 0.4, 0);
    // the arms: pawing at the ground as it crawls; reaching out to seize
    const reach = ord === 'devour' || ord === 'charge' ? -0.7 : 0;
    set('arm.L', Math.sin(ph * 1.3) * 0.25 + reach, 0, 0.1);
    set('arm.R', Math.sin(ph * 1.3 + Math.PI) * 0.25 + reach, 0, -0.1);
    // a red glow on everything, flaring when it attacks
    const flare = ord === 'idle' ? 0.5 : 1.2;
    this.v.forEachMaterial((m) => {
      m.userData.uniforms.uRim.value.set(1, 0.2, 0.25, flare);
      m.userData.uniforms.uDissolve.value = this.endT >= 0 ? Math.min(1, this.endT / 1.1) : 1 - this.rise;
    });
    o.updateMatrixWorld(true);
    void dt;
    // dirt thrown up while it rises
    if (this.rise < 1 && Math.random() < 0.7) {
      const a = Math.random() * Math.PI * 2;
      this.g.engine.dust.spawn({ x: this.pos.x + Math.cos(a) * 5, y: this.pos.y + 0.3, z: this.pos.z + Math.sin(a) * 5, vx: Math.cos(a) * 3, vy: 2 + Math.random() * 2, vz: Math.sin(a) * 3, size: 1.5, sizeEnd: 4, life: 1.4, r: 0.5, g: 0.45, b: 0.4, alpha: 0.5, alphaEnd: 0, drag: 1.2 });
    }
  }

  dispose(): void {
    if (this.devoured) this.spit();
    this.v.object.removeFromParent();
  }
}

// ------------------------------------------------------------------ Nikushibuki

/** Nikushibuki: the puddle of him — black and white, seeping along the ground after him. */
export class Puddle implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.Mesh;

  constructor(private g: Game, readonly owner: Fighter, readonly dur: number) {
    const geo = new THREE.CircleGeometry(0.9, 24);
    geo.rotateX(-Math.PI / 2);
    this.mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#2A2A30', roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.92 }));
    g.engine.gr.scene.add(this.mesh);
    g.sfx.play('splash', owner.pos, 0.8);
  }

  update(dt: number): void {
    this.t += dt;
    if (this.t > this.dur) this.done = true;
  }

  render(): void {
    const p = this.owner.renderPos ?? this.owner.pos;
    this.mesh.position.set(p.x, p.y + 0.03, p.z);
    const k = Math.min(1, this.t / 0.3) * (this.t > this.dur - 0.3 ? Math.max(0.1, (this.dur - this.t) / 0.3) : 1);
    this.mesh.scale.set(k * (1 + Math.sin(this.t * 6) * 0.06), 1, k * (1 + Math.cos(this.t * 5) * 0.06));
    if (Math.random() < 0.3) this.g.engine.glow.spawn({ x: p.x + (Math.random() - 0.5), y: p.y + 0.1, z: p.z + (Math.random() - 0.5), vy: 0.4, size: 0.12, sizeEnd: 0.02, life: 0.5, r: 0.9, g: 0.9, b: 0.95, alpha: 0.5, alphaEnd: 0, tex: TEX_GLOW });
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

export type { DamageOpts };
export { BoxShape };
