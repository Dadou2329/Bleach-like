// Reiatsu aura: a flame shell around the fighter (skinned capsule proxies on the character's own
// skeleton, inflated along normals with upward-scrolling noise tongues and fresnel alpha), rising
// wisps, and a release pillar into the sky. Dark auras (Bankai Ichigo) add an alpha-blended near-black
// layer under the additive rim — additive light cannot make darkness.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { CharacterVisual } from '../game/characterFactory';
import type { SpriteSystem } from './sprites';
import { TEX_GLOW, TEX_STREAK } from './sprites';

export interface AuraStyle {
  core: THREE.ColorRepresentation;
  body: THREE.ColorRepresentation;
  rim: THREE.ColorRepresentation;
  /** near-black inner layer (dark reiatsu) */
  dark?: THREE.ColorRepresentation;
}

export const AURA_ICHIGO_SHIKAI: AuraStyle = { core: '#F9FFFF', body: '#7DDFFD', rim: '#2D74D0' };
export const AURA_ICHIGO_BANKAI: AuraStyle = { core: '#FF8FA0', body: '#B3122E', rim: '#8E1F3F', dark: '#0A0A0C' };

const NOISE = /* glsl */ `
float auHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float auNoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(auHash(i), auHash(i + vec3(1,0,0)), f.x), mix(auHash(i + vec3(0,1,0)), auHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(auHash(i + vec3(0,0,1)), auHash(i + vec3(1,0,1)), f.x), mix(auHash(i + vec3(0,1,1)), auHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
`;

const VERT = /* glsl */ `
#include <common>
#include <skinning_pars_vertex>
uniform float uTime;
uniform float uLevel;
uniform float uInflate;
uniform float uRise;
varying vec3 vN;
varying vec3 vW;
varying float vFlame;
${NOISE}
void main() {
  #include <skinbase_vertex>
  #include <beginnormal_vertex>
  #include <skinnormal_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
  vec4 wp = modelMatrix * vec4(transformed, 1.0);
  vec3 wn = normalize(mat3(modelMatrix) * objectNormal);
  float n1 = auNoise(wp.xyz * 2.6 + vec3(0.0, -uTime * 2.8, 0.0));
  float n2 = auNoise(wp.xyz * 6.5 + vec3(0.0, -uTime * 6.0, 0.0));
  float flame = n1 * 0.65 + n2 * 0.35;
  float up = clamp(wn.y * 0.6 + 0.55, 0.0, 1.0);
  float lv = clamp(uLevel, 0.0, 2.5);
  wp.xyz += wn * uInflate * (0.45 + flame * 1.1) * (0.35 + 0.65 * min(lv, 1.0));
  wp.y += pow(flame, 2.2) * up * uRise * lv;
  vN = wn;
  vW = wp.xyz;
  vFlame = flame;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const FRAG = /* glsl */ `
uniform vec3 uCore;
uniform vec3 uBody;
uniform vec3 uRim;
uniform float uLevel;
uniform float uTime;
uniform float uDark;
varying vec3 vN;
varying vec3 vW;
varying float vFlame;
${NOISE}
void main() {
  vec3 v = normalize(cameraPosition - vW);
  float facing = abs(dot(normalize(vN), v));
  float fres = 1.0 - facing;
  float n = auNoise(vW * 4.5 + vec3(0.0, -uTime * 5.5, 0.0));
  float lv = clamp(uLevel, 0.0, 2.5);
  float body = smoothstep(0.32, 0.85, n * 0.7 + vFlame * 0.5 + fres * 0.35);
  if (uDark > 0.5) {
    // alpha-blended dark core: eroded edges
    float a = body * smoothstep(0.0, 0.6, facing + 0.2) * smoothstep(0.35, 1.0, lv) * 0.8;
    if (a < 0.02) discard;
    gl_FragColor = vec4(uCore, a);
    return;
  }
  // shell only shows from a flare upward; edges carry it (overlapping limb proxies must not pile up)
  float shellK = smoothstep(0.35, 1.0, lv);
  float a = pow(fres, 2.6) * body * shellK * 0.75;
  if (a < 0.004) discard;
  vec3 col = mix(uBody, uRim, smoothstep(0.6, 1.0, fres)) + uCore * pow(facing, 3.0) * 0.4 * body;
  gl_FragColor = vec4(col * (1.0 + lv * 0.7), a);
}`;

/** Capsule proxies (bone, child bone or local end, radius) for the standard humanoid skeleton. */
const PROXIES: [string, string | [number, number, number], number][] = [
  ['hips', 'spine', 0.2], ['spine', 'chest', 0.2], ['chest', 'neck', 0.23], ['neck', 'head', 0.09], ['head', [0, 0.2, 0.02], 0.17],
  ['upperarm.L', 'forearm.L', 0.1], ['forearm.L', 'hand.L', 0.1], ['hand.L', [0, -0.15, 0.02], 0.07],
  ['upperarm.R', 'forearm.R', 0.1], ['forearm.R', 'hand.R', 0.1], ['hand.R', [0, -0.15, 0.02], 0.07],
  ['thigh.L', 'shin.L', 0.15], ['shin.L', 'foot.L', 0.14], ['foot.L', [0, -0.05, 0.14], 0.08],
  ['thigh.R', 'shin.R', 0.15], ['shin.R', 'foot.R', 0.14], ['foot.R', [0, -0.05, 0.14], 0.08],
];

function buildProxyGeometry(v: CharacterVisual): { geo: THREE.BufferGeometry; segs: { bone: number; a: THREE.Vector3; b: THREE.Vector3; r: number }[] } {
  const rig = v.rig;
  const res = rig.res;
  const restWorld = (i: number): THREE.Vector3 => {
    const p = v.model.bones[i].pivot;
    return new THREE.Vector3(p[0] / res, p[1] / res, p[2] / res);
  };
  const parts: THREE.BufferGeometry[] = [];
  const segs: { bone: number; a: THREE.Vector3; b: THREE.Vector3; r: number }[] = [];
  for (const [bn, to, r] of PROXIES) {
    const bi = rig.index(bn);
    if (bi < 0) continue;
    const a = restWorld(bi);
    let b: THREE.Vector3;
    if (typeof to === 'string') {
      const ci = rig.index(to);
      if (ci < 0) continue;
      b = restWorld(ci);
    } else b = a.clone().add(new THREE.Vector3(...to));
    const len = a.distanceTo(b);
    const g = new THREE.CapsuleGeometry(r, Math.max(0.01, len), 4, 10);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    g.applyQuaternion(q);
    g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    g.deleteAttribute('uv');
    const n = g.attributes.position.count;
    const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    for (let k = 0; k < n; k++) { si[k * 4] = bi; sw[k * 4] = 1; }
    g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4));
    g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
    parts.push(g);
    segs.push({ bone: bi, a: a.clone(), b: b.clone(), r });
  }
  const geo = mergeGeometries(parts)!;
  // local offsets per segment in bone space (for wisp emission)
  for (const s of segs) {
    const pv = restWorld(s.bone);
    s.a.sub(pv);
    s.b.sub(pv);
  }
  return { geo, segs };
}

export class Aura {
  readonly group = new THREE.Group();
  private shell: THREE.SkinnedMesh;
  private dark: THREE.SkinnedMesh;
  private uniforms: Record<string, THREE.IUniform>;
  private darkU: Record<string, THREE.IUniform>;
  private segs: { bone: number; a: THREE.Vector3; b: THREE.Vector3; r: number }[];
  /** current and target intensity: 0 off, 0.35 idle shimmer, 1 flare, 2 release */
  level = 0;
  target = 0;
  private hold = 0;
  private emitAcc = 0;
  style: AuraStyle;
  private pillar: THREE.Mesh;
  private pillarT = 0;
  private pillarU: Record<string, THREE.IUniform>;
  private tmpA = new THREE.Vector3();
  private tmpB = new THREE.Vector3();

  constructor(readonly v: CharacterVisual, style: AuraStyle, private glow: SpriteSystem) {
    this.style = style;
    const { geo, segs } = buildProxyGeometry(v);
    this.segs = segs;
    this.uniforms = {
      uTime: { value: 0 }, uLevel: { value: 0 }, uInflate: { value: 0.13 }, uRise: { value: 0.55 },
      uCore: { value: new THREE.Color() }, uBody: { value: new THREE.Color() }, uRim: { value: new THREE.Color() }, uDark: { value: 0 },
    };
    this.darkU = { ...this.uniforms, uDark: { value: 1 }, uInflate: { value: 0.07 }, uCore: { value: new THREE.Color() } };
    const mk = (u: Record<string, THREE.IUniform>, additive: boolean) => {
      const m = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: u,
        transparent: true,
        depthWrite: false,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        side: THREE.FrontSide,
      });
      const mesh = new THREE.SkinnedMesh(geo, m);
      mesh.bind(v.rig.skeleton, new THREE.Matrix4());
      mesh.frustumCulled = false;
      mesh.renderOrder = additive ? 6 : 3;
      return mesh;
    };
    this.dark = mk(this.darkU, false);
    this.shell = mk(this.uniforms, true);
    v.object.add(this.dark, this.shell);
    // release pillar (world space)
    this.pillarU = { uTime: { value: 0 }, uA: { value: 0 }, uCol: { value: new THREE.Color() }, uCore: { value: new THREE.Color() } };
    const pg = new THREE.CylinderGeometry(1, 1.4, 1, 32, 8, true);
    pg.translate(0, 0.5, 0);
    this.pillar = new THREE.Mesh(
      pg,
      new THREE.ShaderMaterial({
        uniforms: this.pillarU,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        vertexShader: /* glsl */ `varying vec2 vUv; varying vec3 vN; varying vec3 vW;
          void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */ `uniform float uTime; uniform float uA; uniform vec3 uCol; uniform vec3 uCore; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
          ${NOISE}
          void main() {
            vec3 v = normalize(cameraPosition - vW);
            float f = abs(dot(vN, v));
            float n = auNoise(vec3(vUv.x * 18.0, vUv.y * 6.0 - uTime * 9.0, 0.0));
            float streak = smoothstep(0.35, 1.0, n);
            float fade = smoothstep(1.0, 0.55, vUv.y) * smoothstep(0.0, 0.04, vUv.y);
            float a = uA * fade * (0.35 + streak * 0.9) * (0.4 + f * 0.8);
            vec3 c = mix(uCol, uCore, pow(f, 3.0));
            gl_FragColor = vec4(c * 2.2, a);
          }`,
      }),
    );
    this.pillar.visible = false;
    this.pillar.frustumCulled = false;
    this.pillar.renderOrder = 7;
    this.group.add(this.pillar);
    this.setStyle(style);
  }

  setStyle(s: AuraStyle): void {
    this.style = s;
    (this.uniforms.uCore.value as THREE.Color).set(s.core);
    (this.uniforms.uBody.value as THREE.Color).set(s.body);
    (this.uniforms.uRim.value as THREE.Color).set(s.rim);
    (this.darkU.uCore.value as THREE.Color).set(s.dark ?? '#000000');
    this.dark.visible = !!s.dark;
    (this.pillarU.uCol.value as THREE.Color).set(s.dark ? s.body : s.body);
    (this.pillarU.uCore.value as THREE.Color).set(s.dark ? '#ffd6dc' : s.core);
  }

  /** Raise the aura to `level` for `seconds` (then it relaxes to the base target). */
  flare(level: number, seconds = 0.6): void {
    this.level = Math.max(this.level, level);
    this.hold = Math.max(this.hold, seconds);
    this.flareLevel = Math.max(level, this.hold > 0 ? this.flareLevel : 0);
  }
  private flareLevel = 0;

  /** Column of reiatsu into the sky (releases). */
  pillarBurst(seconds = 2.2): void {
    this.pillarT = seconds;
    this.pillar.visible = true;
  }

  update(dt: number, time: number): void {
    this.hold = Math.max(0, this.hold - dt);
    const goal = this.hold > 0 ? Math.max(this.target, this.flareLevel) : this.target;
    if (this.hold <= 0) this.flareLevel = 0;
    const k = goal > this.level ? 10 : 2.5;
    this.level += (goal - this.level) * (1 - Math.exp(-k * dt));
    this.uniforms.uTime.value = time;
    this.uniforms.uLevel.value = this.level;
    this.darkU.uTime.value = time;
    this.darkU.uLevel.value = this.level;
    this.shell.visible = this.level > 0.36;
    this.dark.visible = this.shell.visible && !!this.style.dark;
    // wisps
    if (this.level > 0.1) {
      this.emitAcc += dt * (this.level < 0.4 ? this.level * 22 : 8 + this.level * 70);
      const body = new THREE.Color(this.style.body), core = new THREE.Color(this.style.core);
      while (this.emitAcc >= 1) {
        this.emitAcc -= 1;
        const s = this.segs[(Math.random() * this.segs.length) | 0];
        const bone = this.v.rig.bones[s.bone];
        const t = Math.random();
        this.tmpA.lerpVectors(s.a, s.b, t).applyMatrix4(bone.matrixWorld);
        const ang = Math.random() * Math.PI * 2;
        const rr = s.r * (0.8 + Math.random() * 0.8);
        this.tmpA.x += Math.cos(ang) * rr;
        this.tmpA.z += Math.sin(ang) * rr;
        const c = Math.random() < 0.25 ? core : body;
        const dark = !!this.style.dark && Math.random() < 0.45;
        this.glow.spawn({
          x: this.tmpA.x, y: this.tmpA.y, z: this.tmpA.z,
          vx: Math.cos(ang) * 0.4, vy: 1.6 + Math.random() * 2.2 * Math.min(1.5, this.level), vz: Math.sin(ang) * 0.4,
          size: 0.12 + Math.random() * 0.22, sizeEnd: 0.02, life: 0.45 + Math.random() * 0.5,
          r: dark ? 0.6 : c.r, g: dark ? 0.05 : c.g, b: dark ? 0.08 : c.b,
          alpha: Math.min(1, 0.35 + this.level * 0.4), alphaEnd: 0,
          tex: Math.random() < 0.6 ? TEX_STREAK : TEX_GLOW, stretch: 2.5, drag: 0.4,
        });
      }
    }
    // pillar
    if (this.pillarT > 0) {
      this.pillarT -= dt;
      const a = Math.min(1, this.pillarT / 0.6) * Math.min(1, (2.2 - this.pillarT) * 5 + 0.2);
      this.v.object.getWorldPosition(this.tmpB);
      const grow = Math.min(1, (2.3 - this.pillarT) * 3);
      this.pillar.position.copy(this.tmpB);
      this.pillar.scale.set(1.6 + grow * 1.2, 260 * grow + 2, 1.6 + grow * 1.2);
      this.pillarU.uTime.value = time;
      this.pillarU.uA.value = Math.max(0, a);
      if (this.pillarT <= 0) this.pillar.visible = false;
    }
  }
}
