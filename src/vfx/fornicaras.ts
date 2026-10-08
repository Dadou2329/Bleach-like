// Szayelaporro Granz's effects (docs/kits/szayelaporro.md). The lab: Rokureichū's recording bug on whoever it marked,
// the power-control device's scan dome, the trap panel's warning ring. Fornicarás: the wing-branches (grey tubes
// with red drops, driven by `PeacockVines` with the branch look), the burrow travelling under the ground, the black
// fountain of Carbon-Copy and its rain, a copy popping, the purple strand that swells into a doll, and the egg's
// pulse inside Gabriel's host.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import type { VineLook } from './kujaku';
import { groundAt } from './iceArts';
import { TEX_GLOW, TEX_PUFF, TEX_RING, TEX_STREAK } from './sprites';

export const SZAYEL_PINK = { core: '#FFD6EA', body: '#FF79B8', rim: '#B8327A' };
/** the wing-branches: grey bark in two bands, a red drop every fifth ring; holding someone, they flush purple */
export const BRANCH_LOOK: VineLook = {
  a: new THREE.Color('#8F8E97'),
  b: new THREE.Color('#77767F'),
  ring: new THREE.Color('#C3122F'),
  emissive: '#141218',
  hold: new THREE.Color('#7A3E9E'),
  holdRing: new THREE.Color('#E04A5E'),
  wither: new THREE.Color('#3A3440'),
};
const PINK = new THREE.Color('#FF79B8');
const GRID = new THREE.Color('#FF8CC6');
const STRAND = new THREE.Color('#8E3FC0');

const _v = new THREE.Vector3();

/** Rokureichū: a pink mote that rides on its host's shoulder and blinks; `done` once it is called off */
export class BugTag implements Projectile {
  done = false;
  private t = 0;
  constructor(private g: Game, readonly host: Fighter) {}
  update(dt: number): void {
    this.t += dt;
    if (this.host.dead) this.done = true;
    if (this.done) return;
    const h = this.host;
    const p = _v.set(h.pos.x, h.pos.y + h.def.height * 0.86, h.pos.z).addScaledVector(h.forward(), -0.05);
    const side = Math.sin(h.yaw + Math.PI / 2), cside = Math.cos(h.yaw + Math.PI / 2);
    p.x += side * h.def.radius * 0.9;
    p.z += cside * h.def.radius * 0.9;
    const blink = Math.sin(this.t * 7) > 0.2 ? 1 : 0.35;
    this.g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.07 * blink + 0.03, sizeEnd: 0.04, life: dt * 1.5, r: PINK.r * 2, g: PINK.g * 2, b: PINK.b * 2, alpha: 1, alphaEnd: 1, tex: TEX_GLOW });
  }
  dispose(): void {}
}

/** the analysis flash: pink hexagon sparks where a blow was nullified */
export function analysedFlash(g: Game, at: THREE.Vector3): void {
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.engine.glow.spawn({ x: at.x + Math.cos(a) * 0.25, y: at.y + Math.sin(a) * 0.25, z: at.z, vx: Math.cos(a) * 1.5, vy: Math.sin(a) * 1.5, size: 0.12, sizeEnd: 0.02, life: 0.4, r: GRID.r * 2, g: GRID.g * 2, b: GRID.b * 2, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
  }
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: 0.3, sizeEnd: 1.1, life: 0.3, r: GRID.r * 1.8, g: GRID.g * 1.8, b: GRID.b * 1.8, alpha: 0.9, alphaEnd: 0, tex: TEX_RING });
}

/** The power-control device: a scan-grid dome round where he stood; `inside(p)` */
export class LabDome implements Projectile {
  done = false;
  private t = 0;
  private lines: THREE.LineSegments;
  constructor(g: Game, readonly center: THREE.Vector3, readonly radius: number, readonly life: number) {
    const ico = new THREE.IcosahedronGeometry(radius, 2);
    const edges = new THREE.EdgesGeometry(ico);
    ico.dispose();
    // keep the upper half
    const src = edges.getAttribute('position') as THREE.BufferAttribute;
    const keep: number[] = [];
    for (let i = 0; i < src.count; i += 2) {
      if (src.getY(i) < -0.05 * radius && src.getY(i + 1) < -0.05 * radius) continue;
      keep.push(src.getX(i), Math.max(0, src.getY(i)), src.getZ(i), src.getX(i + 1), Math.max(0, src.getY(i + 1)), src.getZ(i + 1));
    }
    edges.dispose();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(keep, 3));
    this.lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: GRID.clone().multiplyScalar(1.6), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.lines.position.copy(center);
    this.lines.frustumCulled = false;
    this.lines.renderOrder = 6;
    g.engine.gr.scene.add(this.lines);
    g.addRing(center.clone().setY(center.y + 0.1), radius, '#FF8CC6', 0.6);
  }
  inside(p: THREE.Vector3): boolean {
    return !this.done && p.distanceTo(this.center) < this.radius;
  }
  update(dt: number): void {
    this.t += dt;
    if (this.t > this.life) this.done = true;
  }
  render(): void {
    const k = Math.min(1, this.t / 0.5) * Math.min(1, (this.life - this.t) / 0.8);
    // a scan line sweeping up the dome
    (this.lines.material as THREE.LineBasicMaterial).opacity = Math.max(0, k * (0.22 + 0.1 * Math.sin(this.t * 6)));
    this.lines.rotation.y = this.t * 0.15;
  }
  dispose(): void {
    this.lines.removeFromParent();
    this.lines.geometry.dispose();
    (this.lines.material as THREE.Material).dispose();
  }
}

/** The burrowing branch: a ridge of torn-up earth running under the ground from `from` to the target, then out. */
export class BurrowRidge implements Projectile {
  done = false;
  private p: THREE.Vector3;
  private travelled = 0;
  constructor(private g: Game, from: THREE.Vector3, private target: () => THREE.Vector3 | null, private speed: number, private range: number, private onArrive: (at: THREE.Vector3) => void) {
    this.p = from.clone();
  }
  update(dt: number, g: Game): void {
    const t = this.target();
    const goal = t ?? this.p.clone().add(_v.set(0, 0, 1));
    const d = _v.subVectors(goal, this.p).setY(0);
    const dist = d.length();
    const step = this.speed * dt;
    if (dist <= step + 0.3 || this.travelled > this.range) {
      this.done = true;
      const at = this.p.clone();
      if (t) at.set(t.x, at.y, t.z);
      const gy = groundAt(g, at.x, at.y + 2, at.z, 6);
      if (gy !== null) at.y = gy;
      this.onArrive(at);
      return;
    }
    this.p.addScaledVector(d.normalize(), step);
    this.travelled += step;
    const gy = groundAt(g, this.p.x, this.p.y + 2, this.p.z, 6);
    if (gy !== null) this.p.y = gy;
    // earth heaving up along its path
    const dust = g.engine.dust;
    for (let i = 0; i < 2; i++)
      dust.spawn({ x: this.p.x + (Math.random() - 0.5) * 0.5, y: this.p.y + 0.1, z: this.p.z + (Math.random() - 0.5) * 0.5, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 2, vz: (Math.random() - 0.5) * 2, size: 0.3, sizeEnd: 0.8, life: 0.6, r: 0.42, g: 0.36, b: 0.3, alpha: 0.6, alphaEnd: 0, tex: TEX_PUFF, drag: 2, gravity: -6 });
  }
  dispose(): void {}
}

/** Carbon-Copy's fountain: black fluid gushing up from his back, then raining over `radius` round him. */
export class CopyFountain implements Projectile {
  done = false;
  private t = 0;
  constructor(private g: Game, private owner: Fighter, private radius: number, readonly dur = 1.2) {}
  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.t > this.dur + 0.8 || this.owner.dead) {
      this.done = true;
      return;
    }
    const o = this.owner;
    const dust = g.engine.dust;
    const back = _v.copy(o.pos).addScaledVector(o.forward(), -0.25).setY(o.pos.y + o.def.height * 0.8);
    if (this.t < this.dur * 0.6) {
      // the gush: straight up out of his back
      for (let i = 0; i < 6; i++)
        dust.spawn({ x: back.x, y: back.y, z: back.z, vx: (Math.random() - 0.5) * 3, vy: 12 + Math.random() * 6, vz: (Math.random() - 0.5) * 3, size: 0.32, sizeEnd: 0.5, life: 0.9, r: 0.04, g: 0.04, b: 0.05, alpha: 0.95, alphaEnd: 0.6, tex: TEX_PUFF, gravity: -14, drag: 0.3 });
      g.engine.glow.spawn({ x: back.x, y: back.y + 1, z: back.z, vy: 10, size: 0.2, sizeEnd: 0.1, life: 0.4, r: 0.35, g: 0.25, b: 0.6, alpha: 0.5, alphaEnd: 0, tex: TEX_STREAK, stretch: 4 });
    }
    if (this.t > 0.35) {
      // the rain: black drops falling everywhere round him
      for (let i = 0; i < 10; i++) {
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * this.radius;
        const x = o.pos.x + Math.cos(a) * r, z = o.pos.z + Math.sin(a) * r;
        dust.spawn({ x, y: o.pos.y + 7 + Math.random() * 2, z, vy: -14, size: 0.12, sizeEnd: 0.1, life: 0.55, r: 0.04, g: 0.04, b: 0.05, alpha: 0.9, alphaEnd: 0.7, tex: TEX_STREAK, stretch: 3 });
      }
    }
  }
  dispose(): void {}
}

/** a copy pops: black fluid bursting out of it, a pink glint */
export function inkBurst(g: Game, at: THREE.Vector3, k = 1): void {
  const dust = g.engine.dust;
  for (let i = 0; i < 26 * k; i++) {
    const a = Math.random() * Math.PI * 2, e = Math.random() * 1.4 - 0.2;
    const v = 3 + Math.random() * 5;
    dust.spawn({ x: at.x, y: at.y, z: at.z, vx: Math.cos(a) * v, vy: e * v + 2, vz: Math.sin(a) * v, size: 0.22, sizeEnd: 0.4, life: 0.7 + Math.random() * 0.4, r: 0.04, g: 0.04, b: 0.05, alpha: 0.95, alphaEnd: 0, tex: TEX_PUFF, gravity: -12, drag: 1 });
  }
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: 0.4, sizeEnd: 1.6, life: 0.3, r: PINK.r * 1.5, g: PINK.g * 1.5, b: PINK.b * 1.5, alpha: 0.7, alphaEnd: 0, tex: TEX_RING });
}

/** Teatro: the purple strand swelling at his palm and bursting — the doll is inside */
export function strandBurst(g: Game, at: THREE.Vector3): void {
  for (let i = 0; i < 16; i++) {
    const a = Math.random() * Math.PI * 2, e = Math.random() * 2 - 1;
    g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, vx: Math.cos(a) * 2.5, vy: e * 2.5, vz: Math.sin(a) * 2.5, size: 0.12, sizeEnd: 0.03, life: 0.45, r: STRAND.r * 2, g: STRAND.g * 2, b: STRAND.b * 2, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 2 });
  }
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: 0.3, sizeEnd: 0.9, life: 0.3, r: STRAND.r * 2.4, g: STRAND.g * 2.4, b: STRAND.b * 2.4, alpha: 0.9, alphaEnd: 0, tex: TEX_RING });
}

/** Gabriel: the egg pulsing purple in the host's belly (one frame's worth) */
export function eggPulse(g: Game, o: Fighter, t: number): void {
  const p = _v.set(o.pos.x, o.pos.y + o.def.height * 0.48, o.pos.z).addScaledVector(o.forward(), o.def.radius * 0.9);
  const k = 0.5 + 0.5 * Math.sin(t * 5);
  g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.12 + k * 0.1, sizeEnd: 0.1, life: 0.05, r: STRAND.r * 2, g: STRAND.g * 2, b: STRAND.b * 2.2, alpha: 0.5 + k * 0.4, alphaEnd: 0.4, tex: TEX_GLOW });
}
