// Even's Meikyō (docs/kits/even.md): a Zanpakutō that is a mirror. Light reflected, bent and focused, in three
// layers. The Shikai's glass: a giant lens a cut passes through (GiantLens), a prism that splits a beam into seven
// coloured rays (PrismRays), a standing mirror that sends shots back (MirrorPane), a lens in the sky that focuses the
// sun into a burning point (SunFocus), the glasses' glint and the flash. The Bankai's still water: a real mirror laid
// over the ground round him (MirrorLake, a three.js Reflector with ripples), a crystal spike out of a reflection
// (CrystalSpike), a sphere of mirrors with a ray bouncing inside it (MirrorPrison), a wave of mirror-water
// (MirrorWave). The final form's light: the kaleidoscope (Kaleidoscope), the sun brought down through a mirror in
// the sky (SunPillar), and the judgment mirror (JudgmentMirror: a standing Reflector in a frame that cracks). Glass
// breaks into shards (GlassShatter); ribbons of light are camera-facing quads with their own colours (Ribbons).
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';
import type { AuraStyle } from './aura';
import type { EnergyColors } from './energy';
import { BoxShape, CapsuleShape, SphereShape } from '../destruction/shapes';
import { SkyTint, type SkyLook } from './fire';
import { TEX_GLOW, TEX_PUFF, TEX_RING, TEX_STREAK } from './sprites';
import { groundAt } from './iceArts';
import { starTexture } from './myojo';
import { Flood, splash } from './water';

export const MEIKYO_VIOLET = '#B9A8FF';
export const MEIKYO_CYAN = '#9FE6FF';
export const MEIKYO_WHITE = '#F4F0FF';
/** Bunkō's seven rays, red to violet */
export const SPECTRUM = ['#FF4A5E', '#FF9A3C', '#FFE14A', '#5CEB7C', '#4AB4FF', '#5A5CFF', '#B46CFF'];

export const AURA_EVEN: AuraStyle = { core: '#F6F4FF', body: '#B9A8FF', rim: '#7FD8FF' };
export const AURA_EVEN_BANKAI: AuraStyle = { core: '#F2FCFF', body: '#A8E8FF', rim: '#B9A8FF' };
export const AURA_EVEN_FINAL: AuraStyle = { core: '#F8F4FF', body: '#C9B6FF', rim: '#FF9EDB' };
/** the Shikai's crescents: glass catching the light */
export const PRISM_COLORS: EnergyColors = { core: '#FFFFFF', body: '#D2E2FF', rim: '#8E7CFF' };
/** the Bankai's: mirror-water */
export const MIRROR_COLORS: EnergyColors = { core: '#F6FDFF', body: '#A8E8FF', rim: '#5A8CD8' };
/** the final form's: light */
export const LIGHT_COLORS: EnergyColors = { core: '#FFFFFF', body: '#EFE8FF', rim: '#B98CFF' };
/** the Bankai's sky: every cloud gone, still and bright, a pale horizon the lake gives back */
export const SKY_STILL: SkyLook = { zen: '#6FA0E8', hor: '#E2ECFF', cloud: '#F2F5FF', cover: 0.1, glow: 1.5, sun: 1.12, hemi: 1.12, fog: '#D8E4F6' };
/** the sun brought down (Tenkyō Shōten, the final release): white light everywhere */
export const SKY_RADIANT: SkyLook = { zen: '#8FB4F0', hor: '#FFF4E6', cloud: '#FFFFFF', cover: 0.05, glow: 2.6, sun: 1.3, hemi: 1.25, fog: '#F0ECF6' };

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _u = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);

function rgb(color: THREE.ColorRepresentation): THREE.Color {
  return new THREE.Color(color);
}

// ------------------------------------------------------------------------------------------------ materials

let beamTex: THREE.CanvasTexture | null = null;
/** across a ribbon of light: a bright core fading to nothing at the edges */
function beamTexture(): THREE.Texture {
  if (beamTex) return beamTex;
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.32, 'rgba(255,255,255,0.3)');
  grad.addColorStop(0.5, 'rgba(255,255,255,1)');
  grad.addColorStop(0.68, 'rgba(255,255,255,0.3)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 64);
  beamTex = new THREE.CanvasTexture(c);
  return beamTex;
}

const GLASS_VERT = 'varying vec3 vN; varying vec3 vW; varying vec3 vL; void main() { vL = position; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }';
const GLASS_FRAG = /* glsl */ `
uniform float uT; uniform float uA; uniform vec3 uTint; uniform vec3 uRim; uniform float uIri; uniform float uFlash;
varying vec3 vN; varying vec3 vW; varying vec3 vL;
vec3 hue(float h) { return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
void main() {
  vec3 v = normalize(cameraPosition - vW);
  float f = 1.0 - abs(dot(normalize(vN), v));
  float rim = f * f;
  // thin-film colours at the grazing edges, drifting
  vec3 iri = hue(fract(f * 1.3 + dot(vL, vec3(0.31, 0.17, 0.23)) * 0.6 + uT * 0.08));
  // a glint sweeping across the glass
  float s = abs(fract(dot(vL, vec3(0.5, 0.8, 0.0)) * 0.5 - uT * 0.35) - 0.5);
  float sweep = smoothstep(0.06, 0.0, s);
  vec3 col = uTint * 0.35 + uRim * rim * 1.6 + iri * rim * uIri * 1.2 + vec3(1.0) * (sweep * 0.8 + uFlash * 2.5);
  float a = uA * (0.12 + rim * 0.75 + sweep * 0.4 + uFlash * 0.6);
  gl_FragColor = vec4(col, a);
}`;

export type GlassMaterial = THREE.ShaderMaterial & { uniforms: Record<'uT' | 'uA' | 'uTint' | 'uRim' | 'uIri' | 'uFlash', THREE.IUniform> };

/** clear glass: almost nothing face on, a bright rim and thin-film colours at the edges, a glint sweeping across */
export function glassMaterial(tint: THREE.ColorRepresentation = '#DDE8FF', rim: THREE.ColorRepresentation = MEIKYO_VIOLET, iri = 0.6, side: THREE.Side = THREE.DoubleSide): GlassMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uA: { value: 1 }, uTint: { value: rgb(tint) }, uRim: { value: rgb(rim) }, uIri: { value: iri }, uFlash: { value: 0 } },
    vertexShader: GLASS_VERT,
    fragmentShader: GLASS_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side,
  }) as GlassMaterial;
}

/** polished mirror: chrome over the sky's prefiltered gradient */
export function mirrorMaterial(g: Game, color: THREE.ColorRepresentation = '#E9EEF6', opacity = 1): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: rgb(color), metalness: 1, roughness: 0.05, envMap: g.engine.gr.envMap, envMapIntensity: 1.6, side: THREE.DoubleSide, transparent: opacity < 1, opacity });
}

/**
 * Ribbons of light: camera-facing quads with their own colour and alpha (vertex colours, HDR), rebuilt every frame
 * by whoever owns them.
 */
export class Ribbons {
  readonly mesh: THREE.Mesh;
  private pos: Float32Array;
  private col: Float32Array;
  private geo: THREE.BufferGeometry;
  private mat: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene, readonly n: number) {
    this.pos = new Float32Array(n * 12);
    this.col = new Float32Array(n * 16);
    const uv = new Float32Array(n * 8);
    const idx: number[] = [];
    for (let i = 0; i < n; i++) {
      uv.set([0, 0, 1, 0, 1, 1, 0, 1], i * 8);
      idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
    }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 4));
    this.geo.setIndex(idx);
    this.mat = new THREE.MeshBasicMaterial({ map: beamTexture(), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    this.mesh = new THREE.Mesh(this.geo, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 7;
    scene.add(this.mesh);
  }

  /** quad i from a to b, `width` wide, facing the camera at `eye` */
  set(i: number, a: THREE.Vector3, b: THREE.Vector3, width: number, c: THREE.Color, alpha: number, eye: THREE.Vector3): void {
    const d = _v.subVectors(b, a);
    const side = _w.copy(d).cross(_u.subVectors(eye, a));
    const l = side.length();
    if (l < 1e-6 || width <= 0 || alpha <= 0) return this.hide(i);
    side.multiplyScalar(width / 2 / l);
    const P = this.pos, o = i * 12;
    P[o] = a.x - side.x; P[o + 1] = a.y - side.y; P[o + 2] = a.z - side.z;
    P[o + 3] = b.x - side.x; P[o + 4] = b.y - side.y; P[o + 5] = b.z - side.z;
    P[o + 6] = b.x + side.x; P[o + 7] = b.y + side.y; P[o + 8] = b.z + side.z;
    P[o + 9] = a.x + side.x; P[o + 10] = a.y + side.y; P[o + 11] = a.z + side.z;
    const C = this.col, k = i * 16;
    for (let j = 0; j < 4; j++) {
      C[k + j * 4] = c.r; C[k + j * 4 + 1] = c.g; C[k + j * 4 + 2] = c.b; C[k + j * 4 + 3] = alpha;
    }
  }

  hide(i: number): void {
    this.pos.fill(0, i * 12, i * 12 + 12);
    this.col.fill(0, i * 16, i * 16 + 16);
  }

  commit(): void {
    (this.geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.geo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.geo.dispose();
    this.mat.dispose();
  }
}

// ------------------------------------------------------------------------------------------------ small effects

/** a burst of split light: a white flash, a ring and streaks in every colour of the spectrum */
export function prismBurst(g: Game, p: THREE.Vector3, scale = 1): void {
  const glow = g.engine.glow;
  glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.8 * scale, sizeEnd: 2.8 * scale, life: 0.22, r: 1.4, g: 1.4, b: 1.5, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
  glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.5 * scale, sizeEnd: 3.6 * scale, life: 0.32, r: 0.8, g: 0.75, b: 1.2, alpha: 0.8, alphaEnd: 0, tex: TEX_RING });
  for (let i = 0; i < 14; i++) {
    const c = rgb(SPECTRUM[i % 7]);
    const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.3) * 1.4;
    const sp = (10 + Math.random() * 12) * scale;
    const d = _v.set(Math.cos(a), e, Math.sin(a)).normalize();
    glow.spawn({ x: p.x, y: p.y, z: p.z, vx: d.x * sp, vy: d.y * sp, vz: d.z * sp, size: 0.14 * scale, sizeEnd: 0.03, life: 0.28 + Math.random() * 0.2, r: c.r * 1.6, g: c.g * 1.6, b: c.b * 1.6, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 3, drag: 6 });
  }
}

/** a cut of light through a point: a streak along `dir` with sparks */
export function lightSlash(g: Game, at: THREE.Vector3, dir: THREE.Vector3, len = 4, color: THREE.ColorRepresentation = MEIKYO_WHITE): void {
  const c = rgb(color);
  for (let i = 0; i < 10; i++) {
    const k = (i / 9 - 0.5) * len;
    const p = _v.copy(at).addScaledVector(dir, k);
    g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, vx: dir.x * 40, vy: dir.y * 40, vz: dir.z * 40, size: 0.24, sizeEnd: 0.05, life: 0.18, r: c.r * 1.5, g: c.g * 1.5, b: c.b * 1.5, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 4, drag: 10 });
  }
  g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, size: 0.6, sizeEnd: 1.8, life: 0.16, r: c.r * 1.3, g: c.g * 1.3, b: c.b * 1.3, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
}

/** motes of light rising off a body */
export function lightMotes(g: Game, f: Fighter, n: number, color: THREE.ColorRepresentation = MEIKYO_VIOLET, spread = 0.6): void {
  const c = rgb(color);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * spread;
    g.engine.glow.spawn({ x: f.pos.x + Math.cos(a) * r, y: f.pos.y + Math.random() * f.def.height, z: f.pos.z + Math.sin(a) * r, vx: 0, vy: 0.8 + Math.random() * 1.4, vz: 0, size: 0.07 + Math.random() * 0.06, sizeEnd: 0.01, life: 0.9 + Math.random() * 0.8, r: c.r, g: c.g, b: c.b, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 0.6 });
  }
}

/** the glasses' glint: a sparkle flashing on his right lens, riding with the head */
export class Glint implements Projectile {
  done = false;
  private t = 0;
  private s: THREE.Sprite;
  private mat: THREE.SpriteMaterial;

  constructor(private g: Game, private f: Fighter, readonly life = 0.5, color: THREE.ColorRepresentation = '#FFFFFF', readonly size = 0.42) {
    this.mat = new THREE.SpriteMaterial({ map: starTexture(), color: rgb(color).multiplyScalar(3), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false });
    this.s = new THREE.Sprite(this.mat);
    this.s.frustumCulled = false;
    this.s.renderOrder = 12;
    g.engine.gr.scene.add(this.s);
  }

  update(dt: number): void {
    this.t += dt;
    if (this.t >= this.life || this.f.dead) this.done = true;
  }

  render(): void {
    const sock = this.f.visual.rig.sockets.get('glasses');
    if (!sock) {
      this.s.visible = false;
      return;
    }
    sock.updateWorldMatrix(true, false);
    // the upper corner of his right lens, a touch in front of it
    this.s.position.copy(sock.localToWorld(_v.set(-0.06, 0.05, 0.04)));
    const k = this.t / this.life;
    this.s.scale.setScalar(Math.max(0.001, this.size * Math.sin(Math.min(1, k) * Math.PI)));
    this.mat.rotation = this.t * 4;
  }

  dispose(): void {
    this.s.removeFromParent();
    this.mat.dispose();
  }
}

// ------------------------------------------------------------------------------------------------ glass shards

/** shards of mirror glass flung from a point: spinning, falling, catching the light, then gone */
export class GlassShatter implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.InstancedMesh;
  private geo: THREE.BufferGeometry;
  private mat: THREE.MeshStandardMaterial;
  private p: THREE.Vector3[] = [];
  private vel: THREE.Vector3[] = [];
  private axis: THREE.Vector3[] = [];
  private spin: number[] = [];
  private size: number[] = [];

  constructor(private g: Game, at: THREE.Vector3, readonly n = 36, speed = 9, size = 0.32, readonly life = 1.2, up = 4) {
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.6, 0, -0.45, -0.4, 0, 0.5, -0.3, 0], 3));
    this.geo.computeVertexNormals();
    this.mat = mirrorMaterial(g, '#EEF3FA');
    this.mesh = new THREE.InstancedMesh(this.geo, this.mat, n);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, e = Math.random() * 2 - 0.6;
      const d = new THREE.Vector3(Math.cos(a), e, Math.sin(a)).normalize();
      this.p.push(at.clone().addScaledVector(d, Math.random() * 0.6));
      this.vel.push(d.multiplyScalar(speed * (0.4 + Math.random() * 0.8)).add(new THREE.Vector3(0, up * Math.random(), 0)));
      this.axis.push(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize());
      this.spin.push((Math.random() - 0.5) * 24);
      this.size.push(size * (0.5 + Math.random()));
    }
    g.engine.gr.scene.add(this.mesh);
    for (let i = 0; i < 8; i++) {
      const c = rgb(SPECTRUM[i % 7]);
      g.engine.glow.spawn({ x: at.x, y: at.y, z: at.z, vx: (Math.random() - 0.5) * speed * 2, vy: Math.random() * speed, vz: (Math.random() - 0.5) * speed * 2, size: 0.12, sizeEnd: 0.02, life: 0.5, r: c.r * 1.4, g: c.g * 1.4, b: c.b * 1.4, alpha: 1, alphaEnd: 0, tex: TEX_GLOW, drag: 2 });
    }
  }

  update(dt: number): void {
    this.t += dt;
    for (let i = 0; i < this.n; i++) {
      this.vel[i].y -= 14 * dt;
      this.vel[i].multiplyScalar(Math.exp(-0.8 * dt));
      this.p[i].addScaledVector(this.vel[i], dt);
    }
    if (this.t >= this.life) this.done = true;
  }

  render(): void {
    const k = Math.max(0, 1 - Math.max(0, this.t - this.life * 0.6) / (this.life * 0.4));
    for (let i = 0; i < this.n; i++) {
      _q.setFromAxisAngle(this.axis[i], this.spin[i] * this.t);
      _m.compose(this.p[i], _q, _v.setScalar(Math.max(0.001, this.size[i] * k)));
      this.mesh.setMatrixAt(i, _m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.geo.dispose();
    this.mat.dispose();
  }
}

// ------------------------------------------------------------------------------------------------ the Shikai's glass

/** Kakudai: a great lens of glass in a silver ring, standing before him; what passes through it comes out larger */
export class GiantLens implements Projectile {
  done = false;
  private t = 0;
  private group = new THREE.Group();
  private glass: GlassMaterial;
  private ringMat: THREE.MeshStandardMaterial;

  constructor(private g: Game, at: THREE.Vector3, normal: THREE.Vector3, readonly radius = 2.4, readonly life = 0.8) {
    this.glass = glassMaterial('#E2ECFF', '#C9B8FF', 0.9);
    const disc = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 12, 0, Math.PI * 2, 0, 0.5), this.glass);
    // a shallow convex cap on each face: a lens, not a pane
    disc.scale.set(radius * 2.1, radius * 2.1, radius * 0.5);
    disc.rotation.x = Math.PI / 2;
    const back = disc.clone();
    back.rotation.x = -Math.PI / 2;
    this.ringMat = mirrorMaterial(g, '#E8ECF2');
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, radius * 0.06, 8, 64), this.ringMat);
    this.group.add(disc, back, ring);
    this.group.position.copy(at);
    this.group.lookAt(_v.copy(at).add(normal));
    for (const m of this.group.children) {
      m.frustumCulled = false;
      m.renderOrder = 6;
    }
    g.engine.gr.scene.add(this.group);
  }

  /** the cut went through: the lens flares */
  flash(): void {
    this.glass.uniforms.uFlash.value = 1;
    const p = this.group.position;
    this.g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: this.radius, sizeEnd: this.radius * 3, life: 0.25, r: 1.4, g: 1.3, b: 1.6, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    this.g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: this.radius * 1.5, sizeEnd: this.radius * 4, life: 0.35, r: 0.9, g: 0.85, b: 1.3, alpha: 0.9, alphaEnd: 0, tex: TEX_RING });
  }

  update(dt: number): void {
    this.t += dt;
    if (this.t >= this.life) this.done = true;
  }

  render(): void {
    const k = this.t / this.life;
    const s = Math.min(1, this.t / 0.12);
    this.group.scale.setScalar(Math.max(0.01, s * (1 + Math.max(0, k - 0.7) * 0.6)));
    this.glass.uniforms.uT.value = this.t;
    this.glass.uniforms.uA.value = k > 0.7 ? Math.max(0, 1 - (k - 0.7) / 0.3) : 1;
    this.glass.uniforms.uFlash.value *= 0.88;
    this.ringMat.opacity = this.glass.uniforms.uA.value;
    this.ringMat.transparent = this.ringMat.opacity < 1;
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const m of this.group.children) (m as THREE.Mesh).geometry.dispose();
    this.glass.dispose();
    this.ringMat.dispose();
  }
}

/**
 * Hansha: a tall hexagonal mirror standing before its owner (it turns with him), a violet light round its edge; it
 * flashes when something strikes it. The kit decides what it stops and what it returns.
 */
export class MirrorPane implements Projectile {
  done = false;
  private t = 0;
  private group = new THREE.Group();
  private chrome: THREE.MeshStandardMaterial;
  private rim: GlassMaterial;
  readonly at = new THREE.Vector3();
  readonly fw = new THREE.Vector3();

  constructor(private g: Game, private owner: Fighter, readonly life = 2.5, readonly size = 1.35) {
    this.chrome = mirrorMaterial(g, '#EDF1F7');
    this.rim = glassMaterial('#F0EAFF', MEIKYO_VIOLET, 1.0);
    const hex = new THREE.Mesh(new THREE.CircleGeometry(size, 6), this.chrome);
    hex.rotation.z = Math.PI / 6;
    const edge = new THREE.Mesh(new THREE.RingGeometry(size * 0.96, size * 1.1, 6), this.rim);
    edge.rotation.z = Math.PI / 6;
    const glow = new THREE.Mesh(new THREE.CircleGeometry(size * 1.02, 6), this.rim);
    glow.rotation.z = Math.PI / 6;
    glow.position.z = 0.02;
    this.group.add(hex, edge, glow);
    for (const m of this.group.children) {
      m.frustumCulled = false;
      m.renderOrder = 6;
    }
    this.group.scale.set(1, 1.35, 1);
    g.engine.gr.scene.add(this.group);
    this.place();
  }

  holds(): boolean {
    return !this.done && this.t < this.life;
  }

  /** a blow or a shot from in front of the mirror */
  covers(from: THREE.Vector3): boolean {
    _v.subVectors(from, this.owner.pos).setY(0);
    return _v.lengthSq() > 0.3 && _v.normalize().dot(this.fw) > 0.2;
  }

  flash(at?: THREE.Vector3): void {
    this.rim.uniforms.uFlash.value = 1;
    const p = at ?? this.at;
    this.g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.8, sizeEnd: 2.6, life: 0.2, r: 1.5, g: 1.4, b: 1.7, alpha: 1, alphaEnd: 0, tex: TEX_GLOW });
    this.g.engine.glow.spawn({ x: p.x, y: p.y, z: p.z, size: 0.6, sizeEnd: 2.8, life: 0.3, r: 0.8, g: 0.75, b: 1.3, alpha: 0.9, alphaEnd: 0, tex: TEX_RING });
  }

  private place(): void {
    this.owner.forward(this.fw);
    this.at.copy(this.owner.pos).addScaledVector(this.fw, 1.05);
    this.at.y += this.owner.def.height * 0.58;
    this.group.position.copy(this.at);
    this.group.rotation.set(0, Math.atan2(this.fw.x, this.fw.z), 0);
  }

  update(dt: number): void {
    this.t += dt;
    this.place();
    if (this.t >= this.life + 0.25 || this.owner.dead) this.done = true;
  }

  render(): void {
    this.place();
    const grow = Math.min(1, this.t / 0.1);
    const fade = this.t < this.life ? 1 : Math.max(0, 1 - (this.t - this.life) / 0.25);
    this.group.scale.set(grow, 1.35 * grow, 1);
    this.rim.uniforms.uT.value = this.t;
    this.rim.uniforms.uA.value = fade;
    this.rim.uniforms.uFlash.value *= 0.85;
    this.chrome.opacity = fade;
    this.chrome.transparent = fade < 1;
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const m of this.group.children) (m as THREE.Mesh).geometry.dispose();
    this.chrome.dispose();
    this.rim.dispose();
  }
}

export interface PrismRay {
  /** where the ray is aimed (it runs on through it to the range) */
  to: THREE.Vector3;
  color: string;
}

/**
 * Bunkō: a triangular prism of glass hangs before him; a white beam goes in and the light comes out split — one ray
 * per colour, fired one after another, each running straight through everything to its range. `onHit(i, f)` is
 * called once for each fighter a ray touches (the kit applies the colour's effect).
 */
export class PrismRays implements Projectile {
  done = false;
  private t = 0;
  private prism: THREE.Mesh;
  private glass: GlassMaterial;
  private ribbons: Ribbons;
  private fired: { a: THREE.Vector3; b: THREE.Vector3; c: THREE.Color; t: number }[] = [];
  private next = 0;

  constructor(private g: Game, private owner: Fighter, readonly at: THREE.Vector3, private from: () => THREE.Vector3, readonly rays: PrismRay[], readonly o: { range: number; radius: number; power: number; step: number; onHit: (i: number, f: Fighter, p: THREE.Vector3) => void }) {
    this.glass = glassMaterial('#F2F4FF', '#FFFFFF', 1.4);
    this.prism = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.3, 3), this.glass);
    this.prism.position.copy(at);
    this.prism.frustumCulled = false;
    this.prism.renderOrder = 6;
    g.engine.gr.scene.add(this.prism);
    this.ribbons = new Ribbons(g.engine.gr.scene, rays.length + 1);
  }

  private fire(i: number): void {
    const { g, owner } = this;
    const r = this.rays[i];
    const dir = _v.subVectors(r.to, this.at);
    if (dir.lengthSq() < 1e-4) owner.forward(dir);
    dir.normalize();
    const a = this.at.clone(), b = this.at.clone().addScaledVector(dir, this.o.range);
    this.fired.push({ a, b, c: rgb(r.color).multiplyScalar(2.6), t: this.t });
    // through everything on its line
    g.engine.destruction.carve(new CapsuleShape(a.clone().addScaledVector(dir, 1), b.clone(), this.o.radius), { mode: 'bore', power: this.o.power, impulse: 4, dust: 0.3, sparks: [rgb(r.color).r, rgb(r.color).g, rgb(r.color).b] });
    const d = b.clone().sub(a);
    const L = d.length();
    d.divideScalar(L);
    for (const f of g.enemiesOf(owner)) {
      const c = f.center(_w);
      const k = Math.max(0, Math.min(L, _u.subVectors(c, a).dot(d)));
      const p = a.clone().addScaledVector(d, k);
      if (p.distanceTo(c) > this.o.radius + f.def.radius + 0.35 && Math.abs(c.y - p.y) > f.def.height * 0.5) continue;
      if (Math.hypot(p.x - c.x, p.z - c.z) > this.o.radius + f.def.radius + 0.35) continue;
      this.o.onHit(i, f, p);
    }
    g.sfx.play('ting', a, 0.6 + i * 0.12);
  }

  update(dt: number): void {
    this.t += dt;
    while (this.next < this.rays.length && this.t >= 0.12 + this.next * this.o.step) this.fire(this.next++);
    if (this.t > 0.12 + this.rays.length * this.o.step + 0.6) this.done = true;
  }

  render(): void {
    const eye = this.g.engine.gr.camera.position;
    this.prism.rotation.y = this.t * 2.4;
    this.glass.uniforms.uT.value = this.t;
    const end = 0.12 + this.rays.length * this.o.step;
    this.glass.uniforms.uA.value = this.t < end + 0.2 ? Math.min(1, this.t / 0.08) : Math.max(0, 1 - (this.t - end - 0.2) / 0.3);
    this.glass.uniforms.uFlash.value = this.t > 0.1 && this.t < end ? 0.5 + 0.5 * Math.sin(this.t * 40) : 0;
    // the white beam going in
    const inA = Math.max(0, Math.min(1, this.t / 0.06)) * (this.t < end ? 1 : Math.max(0, 1 - (this.t - end) / 0.15));
    this.ribbons.set(0, this.from(), this.at, 0.5, _cw.setRGB(2.6, 2.6, 2.8), inA, eye);
    this.fired.forEach((r, i) => {
      const age = this.t - r.t;
      const a = age < 0.05 ? age / 0.05 : Math.max(0, 1 - (age - 0.05) / 0.45);
      this.ribbons.set(i + 1, r.a, r.b, 0.55 * (1 - age * 0.8), r.c, a, eye);
    });
    this.ribbons.commit();
  }

  dispose(): void {
    this.prism.removeFromParent();
    this.prism.geometry.dispose();
    this.glass.dispose();
    this.ribbons.dispose();
  }
}
const _cw = new THREE.Color();

const CONE_FRAG = /* glsl */ `
uniform float uT; uniform float uA; uniform vec3 uC; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main() {
  vec3 v = normalize(cameraPosition - vW);
  float f = abs(dot(normalize(vN), v));
  float stream = 0.75 + 0.25 * sin(vUv.y * 50.0 + uT * 40.0 + vUv.x * 6.283 * 4.0);
  // brighter toward the focus (the narrow end, uv.y = 0 after the flip)
  float k = 1.0 - vUv.y;
  float a = uA * (0.05 + f * 0.25) * (0.35 + k * k * 1.6) * stream;
  gl_FragColor = vec4(uC * (1.2 + k * 2.0), a);
}`;

/**
 * Shōten: a lens forms in the sky over the target and focuses the sun into a white-hot point that follows it: a cone
 * of light down to the point, the ground under it burning and melting into a trench; whoever stands in the focus
 * burns.
 */
export class SunFocus implements Projectile {
  done = false;
  private t = 0;
  private acc = 0;
  private carveAcc = 0;
  private lens = new THREE.Group();
  private glass: GlassMaterial;
  private ringMat: THREE.MeshStandardMaterial;
  private cone: THREE.Mesh;
  private coneMat: THREE.ShaderMaterial;
  private dot: THREE.Sprite;
  private dotMat: THREE.SpriteMaterial;
  readonly focus = new THREE.Vector3();

  constructor(private g: Game, private owner: Fighter, private target: Fighter | null, at: THREE.Vector3, readonly o: { life: number; dps: number; radius: number; height: number; follow: number; lensR?: number }) {
    this.focus.copy(at);
    const R = o.lensR ?? 3.4;
    this.glass = glassMaterial('#FFF8E8', '#FFE7B0', 0.7);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(R, 40), this.glass);
    disc.rotation.x = -Math.PI / 2;
    this.ringMat = mirrorMaterial(g, '#EEF1F6');
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R, R * 0.05, 8, 64), this.ringMat);
    ring.rotation.x = Math.PI / 2;
    this.lens.add(disc, ring);
    this.coneMat = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uA: { value: 0 }, uC: { value: rgb('#FFF1C8') } },
      vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: CONE_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    // apex at the origin (the focus), the open base up at the lens
    const geo = new THREE.CylinderGeometry(R * 0.95, 0.04, 1, 32, 1, true);
    geo.translate(0, 0.5, 0);
    this.cone = new THREE.Mesh(geo, this.coneMat);
    this.dotMat = new THREE.SpriteMaterial({ map: starTexture(), color: rgb('#FFF4D8').multiplyScalar(4), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    this.dot = new THREE.Sprite(this.dotMat);
    for (const m of [this.cone, this.dot, ...this.lens.children]) {
      m.frustumCulled = false;
      m.renderOrder = 7;
    }
    g.engine.gr.scene.add(this.lens, this.cone, this.dot);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const o = this.o;
    const live = this.t < o.life;
    if (live) {
      // the focus slides toward the target's chest
      if (this.target && !this.target.dead) {
        const want = this.target.center(_v);
        const d = _w.subVectors(want, this.focus);
        const l = d.length(), step = o.follow * dt;
        if (l > step) this.focus.addScaledVector(d, step / l);
        else this.focus.copy(want);
      }
      this.acc += dt;
      while (this.acc >= 0.1) {
        this.acc -= 0.1;
        for (const f of g.enemiesOf(this.owner)) {
          const c = f.center(_v);
          if (Math.hypot(c.x - this.focus.x, c.z - this.focus.z) > o.radius + f.def.radius || Math.abs(c.y - this.focus.y) > f.def.height * 0.6 + o.radius) continue;
          g.damage(f, o.dps * 0.1, this.owner, _w.set(0, 0, 0), { quiet: true, energy: true, knock: 0, color: '#FFE7B0' });
        }
      }
      // the ground under the focus burns, then melts
      this.carveAcc += dt;
      if (this.carveAcc >= 0.22) {
        this.carveAcc = 0;
        const gy = groundAt(g, this.focus.x, this.focus.y + 0.5, this.focus.z, 6);
        const p = new THREE.Vector3(this.focus.x, gy ?? this.focus.y - 1, this.focus.z);
        g.engine.destruction.carve(new SphereShape(p.clone(), o.radius * 1.1, 0.7), { mode: 'burn', power: 900, dust: 0.3 });
        g.engine.destruction.carve(new SphereShape(p.clone(), o.radius * 0.7, 0.6), { mode: 'melt', power: 900 });
        g.engine.dust.spawn({ x: p.x, y: p.y + 0.3, z: p.z, vx: (Math.random() - 0.5), vy: 2.5, vz: (Math.random() - 0.5), size: 0.6, sizeEnd: 2.4, life: 1.2, r: 0.45, g: 0.42, b: 0.4, alpha: 0.45, alphaEnd: 0, tex: TEX_PUFF, drag: 0.5 });
      }
      for (let i = 0; i < 2; i++)
        g.engine.glow.spawn({ x: this.focus.x, y: this.focus.y, z: this.focus.z, vx: (Math.random() - 0.5) * 8, vy: Math.random() * 6, vz: (Math.random() - 0.5) * 8, size: 0.1, sizeEnd: 0.02, life: 0.3, r: 1.6, g: 1.2, b: 0.6, alpha: 1, alphaEnd: 0, tex: TEX_STREAK, stretch: 2, gravity: -8 });
    }
    if (this.t >= o.life + 0.35) this.done = true;
  }

  render(): void {
    const o = this.o;
    const k = Math.min(1, this.t / 0.3) * (this.t < o.life ? 1 : Math.max(0, 1 - (this.t - o.life) / 0.35));
    this.lens.position.set(this.focus.x, this.focus.y + o.height, this.focus.z);
    this.lens.scale.setScalar(Math.max(0.01, Math.min(1, this.t / 0.25)));
    this.glass.uniforms.uT.value = this.t;
    this.glass.uniforms.uA.value = k;
    this.ringMat.opacity = k;
    this.ringMat.transparent = k < 1;
    this.cone.position.copy(this.focus);
    this.cone.scale.set(Math.max(0.01, k), o.height, Math.max(0.01, k));
    this.coneMat.uniforms.uT.value = this.t;
    this.coneMat.uniforms.uA.value = k;
    this.dot.position.copy(this.focus);
    this.dot.scale.setScalar(Math.max(0.01, (1.4 + Math.sin(this.t * 30) * 0.25) * k * o.radius));
    this.dotMat.rotation = this.t * 3;
  }

  dispose(): void {
    this.lens.removeFromParent();
    this.cone.removeFromParent();
    this.dot.removeFromParent();
    for (const m of this.lens.children) (m as THREE.Mesh).geometry.dispose();
    this.cone.geometry.dispose();
    this.glass.dispose();
    this.ringMat.dispose();
    this.coneMat.dispose();
    this.dotMat.dispose();
  }
}

// ------------------------------------------------------------------------------------------------ the Bankai's still water

const LAKE_VERT = /* glsl */ `
uniform mat4 textureMatrix; varying vec4 vUv; varying vec2 vP; varying vec3 vW;
void main() { vUv = textureMatrix * vec4(position, 1.0); vP = position.xy; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const LAKE_FRAG = /* glsl */ `
uniform vec3 color; uniform sampler2D tDiffuse; uniform float uT; uniform float uR; uniform float uA; uniform vec3 uTint; uniform vec4 uRip[6];
varying vec4 vUv; varying vec2 vP; varying vec3 vW;
void main() {
  float d = length(vP);
  if (d > uR) discard;
  // a slow swell, and rings spreading from wherever something struck the water
  vec2 off = vec2(sin(vP.y * 0.9 + uT * 1.3), cos(vP.x * 0.8 - uT * 1.1)) * 0.0022;
  float rings = 0.0;
  for (int i = 0; i < 6; i++) {
    vec4 r = uRip[i];
    if (r.w <= 0.0) continue;
    vec2 q = vP - r.xy;
    float dq = length(q) + 1e-4;
    float x = (dq - r.z * 9.0) * 1.2;
    float ring = exp(-x * x) * r.w * exp(-r.z * 1.3);
    off += (q / dq) * ring * 0.018;
    rings += ring;
  }
  vec4 uv = vUv;
  uv.xy += off * uv.w;
  vec3 refl = texture2DProj(tDiffuse, uv).rgb;
  vec3 v = normalize(cameraPosition - vW);
  float fres = 0.62 + 0.38 * pow(1.0 - abs(v.y), 3.0);
  vec3 col = mix(uTint, refl * color, fres);
  col += vec3(0.75, 0.85, 1.0) * rings * 0.35;
  // the shore: a soft bright line where the still water ends
  float edge = smoothstep(uR - 3.0, uR - 0.4, d);
  col += vec3(0.8, 0.88, 1.0) * edge * 0.5;
  float a = uA * (1.0 - smoothstep(uR - 1.2, uR, d)) * 0.94;
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/**
 * Meikyō Shisui: a disc of perfectly still water laid over the ground round its owner — a real mirror (the city, the
 * sky and every fighter in it are reflected), following him over the ground at the height where it was born, rings
 * spreading where something strikes it. It spreads from the blade on release and drains away on `end()`.
 */
export class MirrorLake implements Projectile {
  done = false;
  ending = false;
  private t = 0;
  private r = 0;
  private level = 0;
  readonly center = new THREE.Vector3();
  readonly y: number;
  private refl: Reflector;
  private u: Record<string, THREE.IUniform>;
  private rips: THREE.Vector4[] = [];
  private rip = 0;

  constructor(private g: Game, private owner: Fighter, readonly R = 60) {
    const gy = groundAt(g, owner.pos.x, owner.pos.y + 0.6, owner.pos.z, 8) ?? owner.pos.y;
    this.y = gy + 0.05;
    this.center.set(owner.pos.x, this.y, owner.pos.z);
    const gr = g.engine.gr;
    const low = gr.quality.pixelRatio < 1;
    const k = low ? 0.33 : 0.5;
    const el = gr.renderer.domElement;
    for (let i = 0; i < 6; i++) this.rips.push(new THREE.Vector4(0, 0, 0, 0));
    this.refl = new Reflector(new THREE.CircleGeometry(R, 96), {
      textureWidth: Math.max(256, Math.round(el.width * k)),
      textureHeight: Math.max(256, Math.round(el.height * k)),
      clipBias: 0.003,
      multisample: 0,
      color: 0xffffff,
      shader: {
        name: 'MirrorLake',
        uniforms: {
          color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null },
          uT: { value: 0 }, uR: { value: 0 }, uA: { value: 0 }, uTint: { value: rgb('#BFD6F2') }, uRip: { value: this.rips },
        },
        vertexShader: LAKE_VERT,
        fragmentShader: LAKE_FRAG,
      },
    });
    const mat = this.refl.material as THREE.ShaderMaterial;
    mat.transparent = true;
    mat.depthWrite = false;
    this.u = mat.uniforms;
    this.u.color.value = rgb('#E8F0FF');
    this.u.uRip.value = this.rips;
    this.refl.rotation.x = -Math.PI / 2;
    this.refl.position.copy(this.center);
    this.refl.renderOrder = 2;
    this.refl.frustumCulled = false;
    gr.scene.add(this.refl);
  }

  /** is p standing in the water (over the disc, near its surface)? */
  inside(p: THREE.Vector3, margin = 0): boolean {
    return !this.ending && Math.hypot(p.x - this.center.x, p.z - this.center.z) < this.r + margin && p.y < this.y + 1.6 && p.y > this.y - 2.5;
  }

  /** rings spreading from p */
  ripple(p: THREE.Vector3, strength = 1): void {
    const r = this.rips[this.rip++ % this.rips.length];
    r.set(p.x - this.center.x, -(p.z - this.center.z), 0, strength);
  }

  end(): void {
    this.ending = true;
  }

  update(dt: number): void {
    this.t += dt;
    // it follows its owner over the ground (never up onto the roofs: it stays at its own height)
    const o = this.owner.pos;
    const k = 1 - Math.exp(-dt * 1.5);
    const dx = (o.x - this.center.x) * k, dz = (o.z - this.center.z) * k;
    this.center.x += dx;
    this.center.z += dz;
    for (const r of this.rips) {
      if (r.w <= 0) continue;
      r.x -= dx;
      r.y += dz;
      r.z += dt;
      if (r.z > 3) r.w = 0;
    }
    if (this.ending) {
      this.level = Math.max(0, this.level - dt * 1.4);
      if (this.level <= 0) this.done = true;
    } else this.level = Math.min(1, this.level + dt * 3);
    // spreads out from the blade over a second
    this.r = this.ending ? this.r : Math.min(this.R, this.R * Math.min(1, this.t / 1.1) ** 0.7);
    if (this.owner.dead && !this.ending) this.end();
  }

  render(): void {
    this.refl.position.copy(this.center);
    this.u.uT.value = this.t;
    this.u.uR.value = Math.max(0.01, this.r * (this.ending ? 0.6 + 0.4 * this.level : 1));
    this.u.uA.value = this.level;
  }

  dispose(): void {
    this.refl.removeFromParent();
    this.refl.dispose();
  }
}

/** Mizukagami-tsuki: a spike of crystal bursting out of the mirror under a target, held a moment, then shattered */
export class CrystalSpike implements Projectile {
  done = false;
  private t = 0;
  private group = new THREE.Group();
  private chrome: THREE.MeshStandardMaterial;
  private glass: GlassMaterial;
  private broke = false;

  constructor(private g: Game, readonly at: THREE.Vector3, readonly height = 4.4, readonly radius = 0.9, readonly life = 0.9) {
    this.chrome = mirrorMaterial(g, '#DCEBFF', 0.92);
    this.glass = glassMaterial('#E6F2FF', MEIKYO_CYAN, 1.1);
    const main = new THREE.ConeGeometry(radius, height, 6);
    main.translate(0, height / 2, 0);
    this.group.add(new THREE.Mesh(main, this.chrome), new THREE.Mesh(main, this.glass));
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      const h = height * (0.35 + 0.15 * (i % 2));
      const side = new THREE.ConeGeometry(radius * 0.45, h, 6);
      side.translate(0, h / 2, 0);
      const m = new THREE.Mesh(side, this.chrome);
      m.position.set(Math.cos(a) * radius * 0.7, 0, Math.sin(a) * radius * 0.7);
      m.rotation.set(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45);
      this.group.add(m);
    }
    for (const m of this.group.children) {
      m.frustumCulled = false;
      m.renderOrder = 5;
    }
    this.group.position.copy(at);
    g.engine.gr.scene.add(this.group);
    splash(g, at.clone().setY(at.y + 0.2), 1.6, UP, true);
    g.addRing(at.clone().setY(at.y + 0.1), 5, MEIKYO_CYAN, 0.45);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (!this.broke && this.t >= this.life) {
      this.broke = true;
      g.addProjectile(new GlassShatter(g, this.at.clone().setY(this.at.y + this.height * 0.5), 30, 7, 0.32, 1.0));
      g.sfx.play('crack', this.at, 1.2);
    }
    if (this.broke) this.done = true;
  }

  render(): void {
    const k = Math.min(1, this.t / 0.1);
    this.group.scale.set(1, Math.max(0.01, k * k * (3 - 2 * k)), 1);
    this.glass.uniforms.uT.value = this.t;
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const m of this.group.children) (m as THREE.Mesh).geometry.dispose();
    this.chrome.dispose();
    this.glass.dispose();
  }
}

/**
 * Senkyō Kōrō: hexagonal mirrors fly in and close into a sphere round the target; a ray fired in bounces from mirror
 * to mirror (its trail drawn as ribbons), striking the target on every pass; then the sphere shatters outward.
 */
export class MirrorPrison implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.InstancedMesh;
  private geo: THREE.BufferGeometry;
  private chrome: THREE.MeshStandardMaterial;
  private dirs: THREE.Vector3[] = [];
  private from: THREE.Vector3[] = [];
  private ribbons: Ribbons;
  private path: THREE.Vector3[] = [];
  private struck = 0;
  private hold = new THREE.Vector3();
  private broke = false;
  private readonly N = 42;
  readonly center = new THREE.Vector3();

  constructor(private g: Game, private owner: Fighter, private target: Fighter, readonly o: { radius: number; life: number; hits: number; damage: number; burst: number; power: number }) {
    target.center(this.center);
    this.hold.copy(target.pos);
    this.geo = new THREE.CircleGeometry(0.62, 6);
    this.chrome = mirrorMaterial(g, '#EEF2F8');
    this.mesh = new THREE.InstancedMesh(this.geo, this.chrome, this.N);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < this.N; i++) {
      const y = 1 - (i / (this.N - 1)) * 2, r = Math.sqrt(1 - y * y);
      const d = new THREE.Vector3(Math.cos(ga * i) * r, y, Math.sin(ga * i) * r);
      this.dirs.push(d);
      this.from.push(d.clone().multiplyScalar(14 + Math.random() * 8).add(new THREE.Vector3(0, 6, 0)));
    }
    g.engine.gr.scene.add(this.mesh);
    this.ribbons = new Ribbons(g.engine.gr.scene, 10);
    // the bounce path: the ray comes in from his side, then from mirror to mirror
    const entry = _v.subVectors(owner.center(), this.center).normalize().multiplyScalar(o.radius);
    this.path.push(entry.clone());
    let p = entry.clone();
    for (let i = 0; i < o.hits + 2; i++) {
      let q = new THREE.Vector3();
      do q.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(o.radius);
      while (q.distanceTo(p) < o.radius * 1.1);
      this.path.push(q);
      p = q;
    }
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const tg = this.target, o = this.o;
    const live = this.t < o.life && !tg.dead;
    if (live) {
      // held inside
      tg.body.pos.x = this.hold.x;
      tg.body.pos.z = this.hold.z;
      tg.body.vel.set(0, Math.min(0, tg.body.vel.y), 0);
      tg.push.set(0, 0, 0);
      tg.hitstun = Math.max(tg.hitstun, 0.2);
      // the ray's passes
      const t0 = 0.3, span = o.life - t0;
      while (this.struck < o.hits && this.t >= t0 + (this.struck / o.hits) * span) {
        const first = this.struck === 0, last = this.struck === o.hits - 1;
        const d = _v.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
        g.damage(tg, o.damage, this.owner, d.clone(), { energy: true, unblockable: true, knock: 0, quiet: !(first || last), hitstop: first || last ? 0.08 : 0, color: '#E8F6FF' });
        if (this.struck % 3 === 0) g.sfx.play('ting', this.center, 1.4 + Math.random() * 0.6);
        this.struck++;
      }
    }
    if (!this.broke && (this.t >= o.life || tg.dead)) {
      this.broke = true;
      if (!tg.dead) g.damage(tg, o.burst, this.owner, _v.subVectors(tg.pos, this.owner.pos).setY(0.3).normalize().clone(), { energy: true, unblockable: true, knock: 18, launch: 9, heavy: true, hitstop: 0.16, shake: 0.8, color: '#E8F6FF' });
      g.engine.destruction.carve(new SphereShape(this.center.clone(), o.radius * 1.15, 0.8), { mode: 'explode', power: o.power, impulse: 12, dust: 0.6 });
      g.addProjectile(new GlassShatter(g, this.center.clone(), 46, 14, 0.4, 1.3, 3));
      prismBurst(g, this.center, 2.4);
      g.sfx.play('crack', this.center, 1.6);
      g.sfx.play('explode', this.center, 0.8);
    }
    if (this.t >= o.life + 0.15) this.done = true;
  }

  render(): void {
    const o = this.o;
    const close = Math.min(1, this.t / 0.3);
    const e = close * close * (3 - 2 * close);
    for (let i = 0; i < this.N; i++) {
      const d = this.dirs[i];
      _v.copy(this.from[i]).lerp(_w.copy(d).multiplyScalar(o.radius), e).add(this.center);
      // each pane faces the middle
      _m.lookAt(_v, this.center, UP);
      _q.setFromRotationMatrix(_m);
      _m.compose(_v, _q, _u.setScalar(this.broke ? 0.001 : 1));
      this.mesh.setMatrixAt(i, _m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    // the bouncing ray: a bright head running along the path, the last few legs trailing behind it
    const eye = this.g.engine.gr.camera.position;
    const t0 = 0.3;
    const legs = this.path.length - 1;
    const pos = this.t < t0 ? -1 : ((this.t - t0) / (o.life - t0)) * (legs - 1);
    for (let k = 0; k < 10; k++) {
      const leg = Math.floor(pos) - k;
      if (pos < 0 || leg < 0 || leg >= legs || this.broke) {
        this.ribbons.hide(k);
        continue;
      }
      const a = _cw.setRGB(2.4, 2.6, 3.0);
      const A = this.path[leg].clone().add(this.center), B = this.path[leg + 1].clone().add(this.center);
      if (k === 0) B.lerpVectors(A, B, pos - Math.floor(pos));
      this.ribbons.set(k, A, B, 0.22, a, Math.max(0, 1 - k * 0.12), eye);
    }
    this.ribbons.commit();
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.geo.dispose();
    this.chrome.dispose();
    this.ribbons.dispose();
  }
}

/**
 * Kyōha: the still water rises into a great wave of mirror-glass — a curling sheet across the field ahead — and
 * runs forward, smashing what it meets and throwing everyone on; where it breaks, the ground stays flooded.
 */
export class MirrorWave implements Projectile {
  done = false;
  private t = 0;
  private front = 0;
  private lastCut = 0;
  private mesh: THREE.Mesh;
  private crest: THREE.Mesh;
  private chrome: THREE.MeshStandardMaterial;
  private glass: GlassMaterial;
  private hits = new Set<number>();
  private right: THREE.Vector3;
  private crashed = false;

  constructor(private g: Game, private owner: Fighter, readonly origin: THREE.Vector3, readonly fwd: THREE.Vector3, readonly o: { width: number; height: number; speed: number; range: number; damage: number; rise: number }) {
    this.right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    // a sheet bent into a wave: leaning forward, the crest curling over, bowed out in the middle
    const geo = new THREE.PlaneGeometry(o.width, o.height, 24, 14);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i) + o.height / 2;
      const v = y / o.height, u = x / (o.width / 2);
      const z = Math.sin(v * Math.PI * 0.5) ** 3 * o.height * 0.38 + (1 - u * u) * o.height * 0.12 - Math.max(0, 0.15 - v) * 4;
      pos.setXYZ(i, x, y, z);
    }
    geo.computeVertexNormals();
    this.chrome = mirrorMaterial(g, '#BFE4FF', 0.88);
    this.mesh = new THREE.Mesh(geo, this.chrome);
    this.glass = glassMaterial('#E8F8FF', MEIKYO_CYAN, 1.2);
    this.crest = new THREE.Mesh(geo, this.glass);
    for (const m of [this.mesh, this.crest]) {
      m.frustumCulled = false;
      m.renderOrder = 5;
      _m.makeBasis(this.right, UP, fwd);
      m.quaternion.setFromRotationMatrix(_m);
      m.position.copy(origin);
      g.engine.gr.scene.add(m);
    }
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const o = this.o;
    const rising = this.t < o.rise;
    const moving = !rising && this.front < o.range;
    if (moving) this.front = Math.min(o.range, this.front + o.speed * dt);
    const at = _v.copy(this.origin).addScaledVector(this.fwd, this.front);
    if (moving) {
      if (this.front - this.lastCut > 4) {
        const a = this.lastCut, b = this.front;
        const mid = this.origin.clone().addScaledVector(this.fwd, (a + b) / 2);
        _m.makeBasis(this.fwd, UP, this.right);
        _q.setFromRotationMatrix(_m);
        g.engine.destruction.carve(new BoxShape(mid.clone().setY(mid.y + o.height * 0.3), new THREE.Vector3((b - a) / 2 + 0.4, o.height * 0.32, o.width * 0.42), _q.clone()), { mode: 'smash', power: 2600, impulse: 16, dir: this.fwd.clone(), dust: 0.5 });
        this.lastCut = b;
      }
      for (let k = 0; k < 5; k++) {
        const s = (Math.random() - 0.5) * o.width * 0.9;
        const p = _w.copy(at).addScaledVector(this.right, s);
        g.engine.glow.spawn({ x: p.x, y: p.y + Math.random() * o.height, z: p.z, vx: this.fwd.x * 18, vy: 3 + Math.random() * 5, vz: this.fwd.z * 18, size: 0.5, sizeEnd: 0.1, life: 0.5, r: 0.8, g: 0.95, b: 1.2, alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW, drag: 1.5 });
        g.engine.dust.spawn({ x: p.x, y: p.y + 0.4, z: p.z, vx: this.fwd.x * 12, vy: 2, vz: this.fwd.z * 12, size: 0.8, sizeEnd: 2.4, life: 0.8, r: 0.85, g: 0.92, b: 1, alpha: 0.5, alphaEnd: 0, tex: TEX_PUFF, drag: 1.5 });
      }
      for (const f of g.enemiesOf(this.owner)) {
        if (this.hits.has(f.id) || f.dead) continue;
        _u.subVectors(f.pos, this.origin);
        const along = _u.dot(this.fwd);
        if (along < this.front - 6 || along > this.front + 2) continue;
        if (Math.abs(_u.dot(this.right)) > o.width / 2 + f.def.radius) continue;
        if (_u.y > o.height || _u.y < -6) continue;
        this.hits.add(f.id);
        g.damage(f, o.damage, this.owner, this.fwd.clone(), { energy: true, knock: 30, launch: 12, heavy: true, hitstop: 0.16, shake: 0.9, color: MEIKYO_CYAN });
        f.wetT = Math.max(f.wetT, 8);
        splash(g, f.center(), 1.4, this.fwd, true);
      }
    }
    if (!rising && !moving && !this.crashed) {
      this.crashed = true;
      g.addProjectile(new Flood(g, this.owner, at.clone(), 16, 10, 0.3, { slow: 0.35, soak: true, deep: '#2E6A9A', light: '#BFE6FF', foam: '#F2FAFF' }));
      for (let i = 0; i < 5; i++) splash(g, at.clone().addScaledVector(this.right, (i - 2) * o.width * 0.2).setY(at.y + 1), 2.2, UP, i === 2);
      g.shake(0.6);
    }
    if (this.crashed && this.t > o.rise + o.range / o.speed + 0.6) this.done = true;
  }

  render(): void {
    const o = this.o;
    const rise = Math.min(1, this.t / o.rise);
    const travel = o.rise + o.range / o.speed;
    const fade = this.t < travel ? 1 : Math.max(0, 1 - (this.t - travel) / 0.6);
    for (const m of [this.mesh, this.crest]) {
      m.position.copy(this.origin).addScaledVector(this.fwd, this.front);
      m.scale.set(1, Math.max(0.01, rise * rise * (3 - 2 * rise) * (this.t < travel ? 1 : fade)), 1);
    }
    this.chrome.opacity = 0.88 * fade;
    this.glass.uniforms.uT.value = this.t;
    this.glass.uniforms.uA.value = fade;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.crest.removeFromParent();
    this.mesh.geometry.dispose();
    this.chrome.dispose();
    this.glass.dispose();
  }
}

// ------------------------------------------------------------------------------------------------ the final form's light

/**
 * Hyakkakyō: the target shut inside a kaleidoscope — a sphere of triangular facets in every colour, turning; lines of
 * light flash across it in six-fold symmetry. The kit blinds it, scrambles its steps and cuts it from the mirrored
 * angles; this holds it in place and draws.
 */
export class Kaleidoscope implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.Mesh;
  private glass: GlassMaterial;
  private inner: THREE.Mesh;
  private ribbons: Ribbons;
  private hold = new THREE.Vector3();
  readonly center = new THREE.Vector3();

  constructor(private g: Game, private target: Fighter, readonly radius = 3.4, readonly life = 3) {
    target.center(this.center);
    this.hold.copy(target.pos);
    const geo = new THREE.IcosahedronGeometry(radius, 1).toNonIndexed();
    geo.computeVertexNormals();
    this.glass = glassMaterial('#FFFFFF', '#FFB8F0', 2.2);
    this.mesh = new THREE.Mesh(geo, this.glass);
    this.inner = new THREE.Mesh(new THREE.IcosahedronGeometry(radius * 0.92, 0), mirrorMaterial(g, '#F4F0FF', 0.25));
    for (const m of [this.mesh, this.inner]) {
      m.frustumCulled = false;
      m.renderOrder = 6;
      g.engine.gr.scene.add(m);
    }
    this.ribbons = new Ribbons(g.engine.gr.scene, 6);
  }

  update(dt: number): void {
    this.t += dt;
    const tg = this.target;
    if (this.t < this.life && !tg.dead) {
      tg.body.pos.x = this.hold.x;
      tg.body.pos.z = this.hold.z;
      tg.body.vel.x = 0;
      tg.body.vel.z = 0;
      tg.push.set(0, 0, 0);
    }
    if (this.t >= this.life + 0.3 || tg.dead) this.done = true;
  }

  render(): void {
    const k = Math.min(1, this.t / 0.2) * (this.t < this.life ? 1 : Math.max(0, 1 - (this.t - this.life) / 0.3));
    const s = Math.max(0.01, k * (1 + Math.sin(this.t * 5) * 0.04));
    for (const m of [this.mesh, this.inner]) {
      m.position.copy(this.center);
      m.rotation.set(this.t * 0.5, this.t * 0.9, this.t * 0.3);
      m.scale.setScalar(s);
    }
    this.glass.uniforms.uT.value = this.t * 3;
    this.glass.uniforms.uA.value = k;
    // six-fold lines of light turning inside it
    const eye = this.g.engine.gr.camera.position;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI + this.t * 1.6;
      const d = _v.set(Math.cos(a), Math.sin(a * 2) * 0.3, Math.sin(a)).normalize().multiplyScalar(this.radius * 0.9);
      const A = this.center.clone().add(d), B = this.center.clone().sub(d);
      const c = _cw.set(SPECTRUM[i]).multiplyScalar(2.2);
      this.ribbons.set(i, A, B, 0.18, c, k * (0.5 + 0.5 * Math.sin(this.t * 12 + i)), eye);
    }
    this.ribbons.commit();
  }

  dispose(): void {
    for (const m of [this.mesh, this.inner]) {
      m.removeFromParent();
      m.geometry.dispose();
    }
    this.glass.dispose();
    (this.inner.material as THREE.Material).dispose();
    this.ribbons.dispose();
  }
}

const PILLAR_FRAG = /* glsl */ `
uniform float uT; uniform float uA; uniform vec3 uC; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main() {
  vec3 v = normalize(cameraPosition - vW);
  float f = abs(dot(normalize(vN), v));
  float stream = 0.7 + 0.3 * sin(vUv.y * 90.0 + uT * 50.0 + vUv.x * 6.283 * 5.0);
  gl_FragColor = vec4(uC * (1.4 + f * 1.8) * stream, uA * (0.12 + f * 0.6));
}`;

/**
 * Tenkyō Shōten: a vast mirror opens in the sky and turns the sun on the target — a column of light from the mirror to
 * the ground that follows it slowly, boring a molten shaft; the sky whitens while it burns.
 */
export class SunPillar implements Projectile {
  done = false;
  private t = 0;
  private acc = 0;
  private carveAcc = 0;
  private mirror = new THREE.Group();
  private chrome: THREE.MeshStandardMaterial;
  private rim: GlassMaterial;
  private col: THREE.Mesh;
  private core: THREE.Mesh;
  private colMat: THREE.ShaderMaterial;
  private coreMat: THREE.ShaderMaterial;
  private sky: SkyTint;
  readonly at = new THREE.Vector3();
  private ground: number;

  constructor(private g: Game, private owner: Fighter, private target: Fighter | null, at: THREE.Vector3, readonly o: { radius: number; life: number; dps: number; follow: number; height: number }) {
    this.at.copy(at);
    this.ground = groundAt(g, at.x, at.y + 1, at.z, 12) ?? at.y;
    this.chrome = mirrorMaterial(g, '#F2F4F8');
    this.rim = glassMaterial('#FFF6E0', '#FFE7B0', 1.0);
    const R = o.radius * 2.6;
    const disc = new THREE.Mesh(new THREE.CircleGeometry(R, 48), this.chrome);
    disc.rotation.x = Math.PI / 2;
    const ring = new THREE.Mesh(new THREE.RingGeometry(R, R * 1.12, 48), this.rim);
    ring.rotation.x = Math.PI / 2;
    this.mirror.add(disc, ring);
    const mk = (c: string) => new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uA: { value: 0 }, uC: { value: rgb(c) } },
      vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: PILLAR_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    this.colMat = mk('#FFE9B8');
    this.coreMat = mk('#FFFFFF');
    const geo = new THREE.CylinderGeometry(1, 1, 1, 40, 1, true);
    geo.translate(0, 0.5, 0);
    this.col = new THREE.Mesh(geo, this.colMat);
    this.core = new THREE.Mesh(geo.clone(), this.coreMat);
    for (const m of [this.col, this.core, ...this.mirror.children]) {
      m.frustumCulled = false;
      m.renderOrder = 7;
    }
    g.engine.gr.scene.add(this.mirror, this.col, this.core);
    this.sky = new SkyTint(g, SKY_RADIANT, 2.2);
    g.addProjectile(this.sky);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const o = this.o;
    const live = this.t < o.life;
    if (live) {
      if (this.target && !this.target.dead) {
        const d = _v.subVectors(this.target.pos, this.at).setY(0);
        const l = d.length(), step = o.follow * dt;
        if (l > step) this.at.addScaledVector(d, step / l);
        else this.at.set(this.target.pos.x, this.at.y, this.target.pos.z);
        this.at.y = this.target.pos.y;
      }
      this.acc += dt;
      while (this.acc >= 0.1) {
        this.acc -= 0.1;
        for (const f of g.enemiesOf(this.owner)) {
          if (Math.hypot(f.pos.x - this.at.x, f.pos.z - this.at.z) > o.radius + f.def.radius || f.pos.y > this.at.y + o.height) continue;
          g.damage(f, o.dps * 0.1, this.owner, _w.set(0, -1, 0), { quiet: true, energy: true, unblockable: true, knock: 0, color: '#FFE9B8' });
          f.hitstun = Math.max(f.hitstun, 0.15);
          if (!f.grounded) f.body.vel.y = Math.min(f.body.vel.y, -12);
        }
      }
      this.carveAcc += dt;
      if (this.carveAcc >= 0.3) {
        this.carveAcc = 0;
        const gy = groundAt(g, this.at.x, this.at.y + 2, this.at.z, 30) ?? this.ground;
        this.ground = gy;
        const top = new THREE.Vector3(this.at.x, gy + 3, this.at.z), bot = new THREE.Vector3(this.at.x, gy - 18, this.at.z);
        g.engine.destruction.carve(new CapsuleShape(top, bot, o.radius * 0.85), { mode: 'bore', power: 9000, dust: 0.2 });
        g.engine.destruction.carve(new SphereShape(new THREE.Vector3(this.at.x, gy, this.at.z), o.radius * 1.35, 0.5), { mode: 'melt', power: 9000 });
        g.shake(0.25);
      }
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2, r = o.radius * (0.6 + Math.random() * 0.6);
        g.engine.glow.spawn({ x: this.at.x + Math.cos(a) * r, y: this.ground + 0.4, z: this.at.z + Math.sin(a) * r, vx: Math.cos(a) * 3, vy: 4 + Math.random() * 6, vz: Math.sin(a) * 3, size: 0.4, sizeEnd: 0.08, life: 0.6, r: 1.6, g: 1.3, b: 0.8, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW, drag: 1 });
      }
    }
    if (!live && this.sky.target !== 0) this.sky.target = 0;
    if (this.t >= o.life + 0.5) this.done = true;
  }

  render(): void {
    const o = this.o;
    const open = Math.min(1, this.t / 0.5);
    const k = this.t < 0.45 ? 0 : Math.min(1, (this.t - 0.45) / 0.12) * (this.t < o.life ? 1 : Math.max(0, 1 - (this.t - o.life) / 0.5));
    const top = this.ground + o.height;
    this.mirror.position.set(this.at.x, top, this.at.z);
    this.mirror.scale.setScalar(Math.max(0.01, open));
    this.rim.uniforms.uT.value = this.t;
    this.rim.uniforms.uA.value = this.t < o.life ? open : Math.max(0, 1 - (this.t - o.life) / 0.5);
    this.chrome.opacity = this.rim.uniforms.uA.value;
    this.chrome.transparent = this.chrome.opacity < 1;
    const flick = 1 + Math.sin(this.t * 40) * 0.04;
    this.col.position.set(this.at.x, this.ground - 1, this.at.z);
    this.col.scale.set(Math.max(0.01, o.radius * k * flick), o.height + 1, Math.max(0.01, o.radius * k * flick));
    this.core.position.copy(this.col.position);
    this.core.scale.set(Math.max(0.01, o.radius * 0.42 * k), o.height + 1, Math.max(0.01, o.radius * 0.42 * k));
    for (const m of [this.colMat, this.coreMat]) {
      m.uniforms.uT.value = this.t;
      m.uniforms.uA.value = k;
    }
  }

  dispose(): void {
    this.mirror.removeFromParent();
    this.col.removeFromParent();
    this.core.removeFromParent();
    for (const m of this.mirror.children) (m as THREE.Mesh).geometry.dispose();
    this.col.geometry.dispose();
    this.core.geometry.dispose();
    this.chrome.dispose();
    this.rim.dispose();
    this.colMat.dispose();
    this.coreMat.dispose();
    this.sky.target = 0;
  }
}

/** a soft glow round a rectangle: uSize is the plane's size, uRect the rectangle's half extents (metres) */
const HALO_FRAG = /* glsl */ `
uniform float uA; uniform vec3 uC; uniform vec2 uSize; uniform vec2 uRect;
varying vec2 vUv;
void main() {
  vec2 p = (vUv - 0.5) * uSize;
  vec2 q = abs(p) - uRect;
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  float a = exp(-max(d, 0.0) * 1.5) * uA;
  gl_FragColor = vec4(uC * a * 1.6, a);
}`;

const CRACK_FRAG = /* glsl */ `
uniform float uK; uniform float uA; varying vec2 vUv;
float h(float x) { return fract(sin(x * 127.1) * 43758.5453); }
void main() {
  vec2 p = (vUv - vec2(0.5, 0.56)) * vec2(1.0, 1.55);
  float r = length(p), a = atan(p.y, p.x);
  // jagged rays out from the point of impact, and rings across them
  float n = 13.0;
  float s = floor((a + 3.14159) / 6.28318 * n);
  float ca = (s + 0.5 + (h(s) - 0.5) * 0.6) / n * 6.28318 - 3.14159;
  float ray = smoothstep(0.012, 0.0, abs(sin(a - ca)) * r) * step(r, uK * (0.5 + h(s + 7.0) * 0.6));
  float ring = smoothstep(0.01, 0.0, abs(fract(r * 4.0 + h(s) * 0.4) - 0.5) - 0.48) * step(r, uK * 0.45);
  float c = max(ray, ring * 0.6);
  gl_FragColor = vec4(vec3(1.0, 0.97, 1.0) * 2.2 * c, c * uA);
}`;

/**
 * Jōhari no Kagami: the crystal mirror of the King of Hell rises out of the ground before the target — a real mirror
 * (a standing Reflector) in a dark frame with a violet crest — shows it to itself, flashes, cracks from the middle and
 * bursts into shards. The kit applies the judgment when `judged` turns true.
 */
export class JudgmentMirror implements Projectile {
  done = false;
  judged = false;
  private t = 0;
  private group = new THREE.Group();
  private refl: Reflector;
  private frameMat: THREE.MeshStandardMaterial;
  private trimMat: THREE.MeshStandardMaterial;
  private crest: GlassMaterial;
  private crack: THREE.Mesh;
  private crackMat: THREE.ShaderMaterial;
  private haloMat: THREE.ShaderMaterial;
  private broke = false;
  private base: THREE.Vector3;
  /** the glass's size and the frame's width (metres) */
  static readonly W = 4.2;
  static readonly H = 6.6;
  static readonly T = 0.46;

  constructor(private g: Game, private target: Fighter, at: THREE.Vector3, facing: THREE.Vector3, readonly o: { judgeAt: number; life: number; onJudge: () => void }) {
    const { W, H, T: t } = JudgmentMirror;
    const gr = g.engine.gr;
    const low = gr.quality.pixelRatio < 1;
    this.refl = new Reflector(new THREE.PlaneGeometry(W, H), { textureWidth: low ? 384 : 640, textureHeight: low ? 604 : 1006, clipBias: 0.003, multisample: 0, color: 0xd8dcf0 });
    this.refl.position.set(0, H / 2, 0.02);
    this.frameMat = new THREE.MeshStandardMaterial({ color: '#2B2338', roughness: 0.35, metalness: 0.4, envMap: gr.envMap });
    this.trimMat = new THREE.MeshStandardMaterial({ color: '#D6C08A', roughness: 0.25, metalness: 0.9, envMap: gr.envMap, emissive: '#5E4A20', emissiveIntensity: 0.7 });
    const box = (w: number, h: number, d: number, x: number, y: number, m: THREE.Material) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      b.position.set(x, y, 0);
      return b;
    };
    // the frame, and gold mouldings standing proud of it round the glass and round the outside
    const fx = W / 2 + t / 2, ox = W / 2 + t + 0.05, ix = W / 2 + 0.04;
    this.group.add(this.refl, box(W + t * 2, t, 0.3, 0, H + t / 2, this.frameMat), box(W + t * 2, t, 0.3, 0, -t / 2, this.frameMat), box(t, H + t * 2, 0.3, -fx, H / 2, this.frameMat), box(t, H + t * 2, 0.3, fx, H / 2, this.frameMat));
    this.group.add(box(W + 0.16, 0.08, 0.36, 0, H + 0.04, this.trimMat), box(W + 0.16, 0.08, 0.36, 0, -0.04, this.trimMat), box(0.08, H + 0.16, 0.36, -ix, H / 2, this.trimMat), box(0.08, H + 0.16, 0.36, ix, H / 2, this.trimMat));
    this.group.add(box(W + t * 2 + 0.2, 0.1, 0.36, 0, H + t + 0.05, this.trimMat), box(W + t * 2 + 0.2, 0.1, 0.36, 0, -t - 0.05, this.trimMat), box(0.1, H + t * 2 + 0.2, 0.36, -ox, H / 2, this.trimMat), box(0.1, H + t * 2 + 0.2, 0.36, ox, H / 2, this.trimMat));
    for (const [x, y] of [[-fx, H + t / 2], [fx, H + t / 2], [-fx, -t / 2], [fx, -t / 2]]) {
      const boss = new THREE.Mesh(new THREE.OctahedronGeometry(0.3), this.trimMat);
      boss.position.set(x, y, 0.12);
      this.group.add(boss);
    }
    // the crest: a ring of violet light with an eye of glass over the top of the frame
    this.crest = glassMaterial('#F4ECFF', MEIKYO_VIOLET, 1.4);
    const crestRing = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.11, 8, 40), this.trimMat);
    crestRing.position.set(0, H + t + 1.05, 0);
    const crestEye = new THREE.Mesh(new THREE.CircleGeometry(0.72, 32), this.crest);
    crestEye.position.set(0, H + t + 1.05, 0.05);
    this.group.add(crestRing, crestEye);
    this.crackMat = new THREE.ShaderMaterial({
      uniforms: { uK: { value: 0 }, uA: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: CRACK_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.crack = new THREE.Mesh(new THREE.PlaneGeometry(W, H), this.crackMat);
    this.crack.position.set(0, H / 2, 0.06);
    this.group.add(this.crack);
    // a halo of violet light round the whole frame, behind it (the frame and the glass hide its middle)
    const HW = W + 4, HH = H + 4.5;
    this.haloMat = new THREE.ShaderMaterial({
      uniforms: { uA: { value: 0 }, uC: { value: rgb('#B9A8FF') }, uSize: { value: new THREE.Vector2(HW, HH) }, uRect: { value: new THREE.Vector2(W / 2 + t, H / 2 + t) } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: HALO_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(HW, HH), this.haloMat);
    halo.position.set(0, H / 2, -0.25);
    this.group.add(halo);
    for (const m of this.group.children) {
      m.frustumCulled = false;
      m.renderOrder = 5;
    }
    this.base = at.clone();
    this.group.position.copy(at);
    this.group.rotation.y = Math.atan2(facing.x, facing.z);
    gr.scene.add(this.group);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    const o = this.o;
    const mid = JudgmentMirror.H / 2;
    if (!this.judged && this.t >= o.judgeAt) {
      this.judged = true;
      o.onJudge();
      const c = this.group.position.clone().setY(this.base.y + mid);
      prismBurst(g, c, 3);
      g.sfx.play('crack', c, 1.8);
    }
    if (!this.broke && this.t >= o.life) {
      this.broke = true;
      const c = this.group.position.clone().setY(this.base.y + mid);
      g.addProjectile(new GlassShatter(g, c, 80, 12, 0.45, 1.4, 3));
      g.sfx.play('explode', c, 0.9);
      this.done = true;
    }
    if (this.target.dead && this.t < o.judgeAt) this.done = true;
  }

  render(): void {
    const rise = Math.min(1, this.t / 0.8);
    const e = rise * rise * (3 - 2 * rise);
    // it rises out of the ground (the whole of it, crest and all, starts below)
    const depth = JudgmentMirror.H + JudgmentMirror.T + 2.2;
    this.group.position.set(this.base.x, this.base.y - depth * (1 - e), this.base.z);
    this.crest.uniforms.uT.value = this.t;
    this.crest.uniforms.uFlash.value = this.judged ? Math.max(0, 1 - (this.t - this.o.judgeAt) * 3) : 0.2 + 0.2 * Math.sin(this.t * 6);
    this.crackMat.uniforms.uK.value = this.judged ? Math.min(1.2, (this.t - this.o.judgeAt) * 2.4) : 0;
    this.haloMat.uniforms.uA.value = (0.55 + 0.15 * Math.sin(this.t * 7)) * e + (this.judged ? Math.max(0, 1.4 - (this.t - this.o.judgeAt) * 4) : 0);
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const m of this.group.children) if (m !== this.refl) (m as THREE.Mesh).geometry.dispose();
    this.refl.dispose();
    this.frameMat.dispose();
    this.trimMat.dispose();
    this.crest.dispose();
    this.crackMat.dispose();
    this.haloMat.dispose();
  }
}

/** a pillar of light poured down on a fighter (the releases), in his colours */
export class ReleaseLight implements Projectile {
  done = false;
  private t = 0;
  private mesh: THREE.Mesh;
  private mat: THREE.ShaderMaterial;

  constructor(private g: Game, private f: Fighter, readonly color: THREE.ColorRepresentation, readonly life = 1.6, readonly radius = 2.2, readonly height = 120) {
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uA: { value: 1 }, uC: { value: rgb(color) } },
      vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `uniform float uT; uniform float uA; uniform vec3 uC; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        vec3 hue(float h) { return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
        void main() { vec3 v = normalize(cameraPosition - vW); float f = abs(dot(normalize(vN), v));
          float stream = 0.7 + 0.3 * sin(vUv.y * 60.0 - uT * 30.0 + vUv.x * 6.283 * 3.0);
          float fade = smoothstep(1.0, 0.6, vUv.y);
          vec3 c = mix(uC, hue(fract(vUv.y * 3.0 - uT * 0.5)), (1.0 - f) * 0.5);
          gl_FragColor = vec4(c * (1.2 + f * 1.4) * stream, uA * (0.1 + f * 0.55) * fade); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    const geo = new THREE.CylinderGeometry(1, 1, 1, 32, 1, true);
    geo.translate(0, 0.5, 0);
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 6;
    g.engine.gr.scene.add(this.mesh);
  }

  update(dt: number, g: Game): void {
    this.t += dt;
    if (this.t < this.life * 0.7) lightMotes(g, this.f, 3, this.color, this.radius);
    if (this.t > this.life) this.done = true;
  }

  render(): void {
    const k = this.t / this.life;
    const r = this.radius * (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) * 0.8);
    this.mesh.position.set(this.f.pos.x, this.f.pos.y - 1, this.f.pos.z);
    this.mesh.scale.set(Math.max(0.01, r), this.height, Math.max(0.01, r));
    this.mat.uniforms.uT.value = this.t;
    this.mat.uniforms.uA.value = Math.max(0, 1 - Math.max(0, k - 0.6) / 0.4);
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}
