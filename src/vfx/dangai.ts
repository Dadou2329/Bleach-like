// Post-Dangai Ichigo's effects (docs/kits/ichigo.md §4 Fake Karakura, §7): the black-crimson shockwave every Bankai v2
// blow throws, the black smoke the Final Getsuga form sheds (off the wound arm, the flicker-steps, the forming blade),
// the dimmed sky of the form and the put-out sky of Mugetsu, and Mugetsu itself — a curtain of black reiatsu falling
// across everything ahead, a fissure torn along its middle.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import { BoxShape, SphereShape } from '../destruction/shapes';
import { TEX_GLOW, TEX_PUFF, TEX_STREAK } from './sprites';
import type { SkyLook } from './fire';

const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();

/** Bankai v2's reiatsu: black over crimson */
export const DANGAI_CRIMSON = '#C2304F';
export const DANGAI_ROSE = '#FFB3BF';
/** the Final Getsuga form: the light goes grey and thin round him */
export const SKY_FINAL: SkyLook = { zen: '#2A2A33', hor: '#4E3A3E', cloud: '#3A3438', cover: 0.75, glow: 0.35, sun: 0.55, hemi: 0.72, fog: '#3E3639' };
/** Mugetsu: the sky put out — black, a last red seam at the horizon */
export const SKY_MUGETSU: SkyLook = { zen: '#141418', hor: '#2E0C12', cloud: '#18101A', cover: 0.95, glow: 0.05, sun: 0.1, hemi: 0.3, fog: '#17101A' };

/** Black reiatsu smoke: `n` puffs round `at`, drifting up (spread m, size scale). */
export function blackSmoke(g: Game, at: THREE.Vector3, n: number, spread = 0.4, size = 1, vel?: THREE.Vector3): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * spread;
    g.engine.dust.spawn({
      x: at.x + Math.cos(a) * r, y: at.y + (Math.random() - 0.5) * spread, z: at.z + Math.sin(a) * r,
      vx: (vel?.x ?? 0) + (Math.random() - 0.5) * 1.2, vy: (vel?.y ?? 0) + 0.6 + Math.random() * 1.2, vz: (vel?.z ?? 0) + (Math.random() - 0.5) * 1.2,
      size: 0.28 * size, sizeEnd: (0.8 + Math.random() * 0.5) * size, life: 0.55 + Math.random() * 0.45,
      r: 0.03, g: 0.025, b: 0.035, alpha: 0.75, alphaEnd: 0, tex: TEX_PUFF, drag: 2.2,
    });
  }
}

/** A few crimson embers through the smoke (the edge of the black reiatsu). */
export function embers(g: Game, at: THREE.Vector3, n: number, speed = 3): void {
  const c = new THREE.Color(DANGAI_CRIMSON);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, up = Math.random();
    g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, vx: Math.cos(a) * speed * (1 - up * 0.5), vy: up * speed, vz: Math.sin(a) * speed * (1 - up * 0.5), size: 0.08, sizeEnd: 0.02, life: 0.35 + Math.random() * 0.3, r: c.r, g: c.g, b: c.b, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2.5, drag: 3 });
  }
}

/**
 * The shockwave a Bankai v2 blow throws: a black-crimson ring out across the ground and a burst of streaks; whoever
 * stands inside it is struck by the wave too (returns the number struck).
 */
export function dangaiWave(g: Game, owner: Fighter, at: THREE.Vector3, radius: number, damage: number, ground: number | null): number {
  const base = new THREE.Vector3(at.x, ground ?? at.y, at.z);
  g.addRing(base.clone().setY(base.y + 0.06), radius, DANGAI_CRIMSON, 0.32);
  if (ground !== null) {
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + Math.random() * 0.3;
      g.engine.dust.spawn({ x: base.x + Math.cos(a) * 0.6, y: base.y + 0.15, z: base.z + Math.sin(a) * 0.6, vx: Math.cos(a) * radius * 2.6, vy: 0.4, vz: Math.sin(a) * radius * 2.6, size: 0.5, sizeEnd: 1.4, life: 0.45, r: 0.62, g: 0.58, b: 0.56, alpha: 0.4, alphaEnd: 0, tex: TEX_PUFF, drag: 4 });
    }
  }
  const c = new THREE.Color(DANGAI_CRIMSON);
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * Math.PI * 2;
    const dark = i % 3 !== 0;
    g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, vx: Math.cos(a) * 12, vy: (Math.random() - 0.3) * 4, vz: Math.sin(a) * 12, size: dark ? 0.28 : 0.18, sizeEnd: 0.04, life: 0.22, r: dark ? 0.05 : c.r, g: dark ? 0.02 : c.g, b: dark ? 0.03 : c.b, alpha: 0.9, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 5 });
  }
  let n = 0;
  for (const o of g.enemiesOf(owner)) {
    _v.subVectors(o.pos, base);
    if (Math.abs(o.pos.y + o.def.height * 0.5 - at.y) > 2.6) continue;
    _v.y = 0;
    const d = _v.length();
    if (d > radius + o.def.radius) continue;
    if (d > 1e-3) _v.divideScalar(d);
    else owner.forward(_v);
    g.damage(o, damage * (1 - 0.5 * Math.min(1, d / radius)), owner, _v.clone(), { knock: 9, hitstop: 0.03, quiet: true });
    n++;
  }
  return n;
}

// ------------------------------------------------------------------------------------------------ Mugetsu

let curtainMat: THREE.ShaderMaterial | null = null;

function makeCurtainMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uA: { value: 1 }, uT: { value: 0 }, uC: { value: new THREE.Color('#141418') }, uE: { value: new THREE.Color('#B0102A') } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */ `
      uniform float uA; uniform float uT; uniform vec3 uC; uniform vec3 uE; varying vec2 vUv;
      float h1(float x) { return fract(sin(x * 127.1) * 43758.5453); }
      void main() {
        // columns of black reiatsu poured down, ragged where they tear off at the top
        float col = floor(vUv.x * 120.0);
        float top = 0.62 + 0.34 * h1(col) + 0.04 * sin(uT * 3.0 + col);
        float body = 1.0 - smoothstep(top - 0.18, top, vUv.y);
        float side = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
        float streak = 0.75 + 0.25 * h1(col + floor(vUv.y * 40.0 - uT * 30.0));
        // the crimson seam where the curtain meets the ground
        float seam = 1.0 - smoothstep(0.0, 0.05, vUv.y);
        vec3 c = mix(uC * streak, uE * 2.2, seam);
        gl_FragColor = vec4(c, uA * side * max(body * 0.94, seam));
      }`,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

/**
 * Mugetsu: a wall of black reiatsu sweeping out across everything ahead (width × height m, at `speed` m/s for `range`
 * m). Whoever it passes over takes the blow — it cannot be blocked — and has their power sealed a while; along its
 * middle it tears a fissure into the ground. `onDone` runs when the curtain has gone out.
 */
export class MugetsuCurtain implements Projectile {
  done = false;
  private t = 0;
  private front = 0;
  private lastCut = 0;
  private sheet: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  private hits = new Set<number>();
  private right: THREE.Vector3;

  constructor(private g: Game, private owner: Fighter, readonly origin: THREE.Vector3, readonly fwd: THREE.Vector3,
    readonly o: { width: number; height: number; speed: number; range: number; damage: number; seal: number }) {
    this.right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    this.mat = (curtainMat ??= makeCurtainMaterial()).clone();
    const geo = new THREE.PlaneGeometry(o.width, o.height);
    geo.translate(0, o.height / 2 - 2, 0);
    this.sheet = new THREE.Mesh(geo, this.mat);
    this.sheet.frustumCulled = false;
    this.sheet.renderOrder = 5;
    _m.makeBasis(this.right, new THREE.Vector3(0, 1, 0), fwd);
    this.sheet.quaternion.setFromRotationMatrix(_m);
    this.sheet.position.copy(origin);
    g.engine.gr.scene.add(this.sheet);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const o = this.o;
    const moving = this.front < o.range;
    if (moving) this.front = Math.min(o.range, this.front + o.speed * dt);
    this.sheet.position.copy(this.origin).addScaledVector(this.fwd, this.front);
    this.mat.uniforms.uT.value = this.t;
    this.mat.uniforms.uA.value = moving ? Math.min(1, this.t / 0.15) : Math.max(0, 1 - (this.front >= o.range ? (this.t - o.range / o.speed) / 1.2 : 0));
    if (moving) {
      // the fissure along its middle: a black seam erased into the ground, gouged every few metres
      if (this.front - this.lastCut > 3) {
        const a = this.lastCut, b = this.front;
        const mid = this.origin.clone().addScaledVector(this.fwd, (a + b) / 2);
        mid.y -= 1.5;
        _m.makeBasis(this.fwd, new THREE.Vector3(0, 1, 0), this.right);
        _q.setFromRotationMatrix(_m);
        g.engine.destruction.carve(new BoxShape(mid, new THREE.Vector3((b - a) / 2 + 0.3, 5, 0.45), _q.clone()), { mode: 'erase', power: 1e6, noCollapse: false });
        g.engine.destruction.carve(new SphereShape(mid.clone().setY(this.origin.y), 2.4, 0.6), { mode: 'smash', power: 5000, impulse: 10, dust: 0.8, dir: this.fwd.clone() });
        this.lastCut = b;
      }
      // the black poured off its top edge, a red seam along the ground
      const c = new THREE.Color('#B0102A');
      for (let k = 0; k < 6; k++) {
        const s = (Math.random() - 0.5) * o.width * 0.9;
        const p = this.origin.clone().addScaledVector(this.fwd, this.front).addScaledVector(this.right, s);
        g.engine.dust.spawn({ x: p.x, y: p.y + o.height * (0.4 + Math.random() * 0.5), z: p.z, vx: this.fwd.x * 6, vy: 2 + Math.random() * 3, vz: this.fwd.z * 6, size: 3, sizeEnd: 7, life: 1.2, r: 0.03, g: 0.02, b: 0.03, alpha: 0.7, alphaEnd: 0, tex: TEX_PUFF, drag: 1 });
        g.engine.glow.spawn({ x: p.x, y: p.y + 0.3, z: p.z, vx: this.fwd.x * 10, vy: 1, vz: this.fwd.z * 10, size: 0.9, sizeEnd: 0.2, life: 0.4, r: c.r, g: c.g, b: c.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW, drag: 2 });
      }
      for (const f of g.enemiesOf(this.owner)) {
        if (this.hits.has(f.id) || f.dead) continue;
        _v.subVectors(f.pos, this.origin);
        const along = _v.dot(this.fwd);
        if (along < -1.5 || along > this.front) continue;
        if (Math.abs(_v.dot(this.right)) > o.width / 2 + f.def.radius) continue;
        if (_v.y > o.height - 2 || _v.y < -8) continue;
        this.hits.add(f.id);
        g.damage(f, o.damage, this.owner, this.fwd.clone(), { knock: 30, launch: 9, heavy: true, hitstop: 0.2, shake: 1, unblockable: true });
        // the blow seals the power that took it (Mugetsu left Aizen's Hōgyoku unable to heal him)
        f.sealT = Math.max(f.sealT, o.seal);
        f.sealK = Math.max(f.sealK, 0.3);
        const p = f.center();
        for (let k = 0; k < 30; k++) g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: this.fwd.x * 14 + (Math.random() - 0.5) * 8, vy: (Math.random() - 0.3) * 8, vz: this.fwd.z * 14 + (Math.random() - 0.5) * 8, size: 0.3, sizeEnd: 0.05, life: 0.5, r: k % 4 ? 0.04 : 0.7, g: k % 4 ? 0.02 : 0.06, b: k % 4 ? 0.03 : 0.12, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 2 });
      }
    }
    if (!moving && this.mat.uniforms.uA.value <= 0) this.done = true;
  }

  dispose(): void {
    this.sheet.removeFromParent();
    this.sheet.geometry.dispose();
    this.mat.dispose();
  }
}

/** The arm's black smoke trailing off a strike (a wisp at `p` every call). */
export function armSmoke(g: Game, p: THREE.Vector3, vel?: THREE.Vector3): void {
  g.engine.dust.spawn({ x: p.x, y: p.y, z: p.z, vx: (vel?.x ?? 0) * 0.2, vy: 0.5, vz: (vel?.z ?? 0) * 0.2, size: 0.18, sizeEnd: 0.6, life: 0.45, r: 0.03, g: 0.025, b: 0.035, alpha: 0.8, alphaEnd: 0, tex: TEX_PUFF, drag: 3 });
  if (Math.random() < 0.3) {
    const c = new THREE.Color(DANGAI_CRIMSON);
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: 0, vy: 0.6, vz: 0, size: 0.06, sizeEnd: 0.02, life: 0.3, r: c.r, g: c.g, b: c.b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
  }
}

