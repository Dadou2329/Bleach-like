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
/** Hollowfied: black reiatsu edged in a hotter crimson */
export const AURA_ICHIGO_HOLLOW: AuraStyle = { core: '#FF5C73', body: '#A30F27', rim: '#3D0710', dark: '#020203' };
/** Hollow Ichigo (docs/roster/A1-ichigo.md §2): white reiatsu rimmed red in Shikai, red in Bankai, and in the
 * Full Hollow black reiatsu with a pale edge */
export const AURA_WHITE_SHIKAI: AuraStyle = { core: '#FFFFFF', body: '#D9D6E0', rim: '#D41A33' };
export const AURA_WHITE_BANKAI: AuraStyle = { core: '#FFD3DA', body: '#E81C38', rim: '#7E0A17' };
export const AURA_WHITE_HOLLOW: AuraStyle = { core: '#F3F3F0', body: '#7D7A88', rim: '#D41A33', dark: '#020203' };

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
  wp.y += pow(max(flame, 0.0), 2.2) * up * uRise * lv;
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
  // clamped: |dot| of two unit vectors can come out a hair above 1, and pow() of a negative base is NaN,
  // which bloom smears over the whole frame
  float facing = clamp(abs(dot(normalize(vN), v)), 0.0, 1.0);
  float fres = 1.0 - facing;
  float lv = clamp(uLevel, 0.0, 2.5);
  // flame tongues: vertically stretched noise scrolling up, eroded into separate licks
  vec3 q = vec3(vW.x * 3.2, vW.y * 1.1 - uTime * 3.4, vW.z * 3.2);
  float n = auNoise(q) * 0.6 + auNoise(q * 2.3 + 7.1) * 0.4;
  float lick = smoothstep(0.42, 0.78, n + fres * 0.25 + vFlame * 0.2);
  float shellK = smoothstep(0.35, 1.0, lv);
  if (uDark > 0.5) {
    float a = lick * smoothstep(0.3, 0.9, facing) * shellK * 0.35;
    if (a < 0.03) discard;
    gl_FragColor = vec4(uCore, a);
    return;
  }
  // edges carry the shell (overlapping limb proxies must not pile up in the middle)
  float a = lick * pow(fres, 3.2) * shellK * 0.5;
  if (a < 0.004) discard;
  vec3 col = mix(uBody, uRim, smoothstep(0.55, 1.0, fres));
  col += uCore * smoothstep(0.75, 1.0, n) * 0.8;
  gl_FragColor = vec4(col * (1.1 + lv * 0.6), a);
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
  // a rig without the humanoid bones (creatures, summons) gets one capsule up from its root
  const proxies: typeof PROXIES = PROXIES.some(([bn]) => rig.index(bn) >= 0) ? PROXIES : [[v.model.bones[0].name, [0, 0.6, 0], 0.4]];
  for (const [bn, to, r] of proxies) {
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
  private pillarDur = 2.4;
  private flames: FlameCards;
  private darkFlames: FlameCards;
  private pillarU: Record<string, THREE.IUniform>;
  private tmpA = new THREE.Vector3();
  private tmpB = new THREE.Vector3();

  constructor(readonly v: CharacterVisual, style: AuraStyle, private glow: SpriteSystem) {
    this.style = style;
    const { geo, segs } = buildProxyGeometry(v);
    this.segs = segs;
    this.uniforms = {
      uTime: { value: 0 }, uLevel: { value: 0 }, uInflate: { value: 0.11 }, uRise: { value: 0.75 },
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
    this.flames = new FlameCards(segs, 70, style, false);
    this.darkFlames = new FlameCards(segs, 46, style, true);
    this.group.add(this.darkFlames.mesh, this.flames.mesh);
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
    this.flames?.setStyle(s, false);
    this.darkFlames?.setStyle(s, true);
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
    this.pillarDur = seconds;
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
    const flameLv = this.level < 0.36 ? 0 : (this.level - 0.3) * 1.1;
    this.flames.update(this.v.rig.bones, flameLv, time);
    this.darkFlames.mesh.visible = !!this.style.dark;
    if (this.style.dark) this.darkFlames.update(this.v.rig.bones, flameLv, time, 0.8);
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
      const el = this.pillarDur - this.pillarT;
      const a = Math.min(1, this.pillarT / 0.6) * Math.min(1, el * 5 + 0.2);
      this.v.object.getWorldPosition(this.tmpB);
      const grow = Math.min(1, el * 3 + 0.05);
      this.pillar.position.copy(this.tmpB);
      this.pillar.scale.set(1.2 + grow * 0.9, 260 * grow + 2, 1.2 + grow * 0.9);
      this.pillarU.uTime.value = time;
      this.pillarU.uA.value = Math.max(0, a);
      if (this.pillarT <= 0) this.pillar.visible = false;
    }
  }
}

// ---------------------------------------------------------------------------------------------- flame cards

const CARD_VERT = /* glsl */ `
attribute vec3 aPos;
attribute vec4 aParam; // width, height, phase, intensity
attribute vec2 aDir;   // outward horizontal direction of the anchor
varying vec2 vUv;
varying float vPhase;
varying float vInt;
void main() {
  vUv = uv;
  vPhase = aParam.z;
  vec3 toCam = cameraPosition - aPos;
  toCam.y = 0.0;
  // silhouette weighting: flames on the edges stay, flames between camera and body fade
  float side = abs(dot(normalize(toCam + vec3(1e-4, 0.0, 0.0)), vec3(aDir.x, 0.0, aDir.y)));
  vInt = aParam.w * mix(1.0, 0.18, smoothstep(0.35, 0.95, side) * step(0.0, dot(toCam, vec3(aDir.x, 0.0, aDir.y))));
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), normalize(toCam + vec3(1e-4, 0.0, 0.0))));
  vec3 wp = aPos + right * (uv.x - 0.5) * aParam.x + vec3(0.0, 1.0, 0.0) * uv.y * aParam.y;
  // push slightly toward the camera so cards sit in front of the surface they grow from
  wp += normalize(cameraPosition - aPos) * 0.06;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;

const CARD_FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uCore;
uniform vec3 uBody;
uniform vec3 uRim;
uniform float uDark;
varying vec2 vUv;
varying float vPhase;
varying float vInt;
${NOISE}
void main() {
  float v = vUv.y;
  float t = uTime * 3.2 + vPhase * 17.0;
  // sway grows with height, tongue narrows to a point
  float sway = (auNoise(vec3(v * 3.0 - t, vPhase * 9.0, 0.0)) - 0.5) * 0.55 * v;
  float x = vUv.x - 0.5 - sway;
  float w = 0.5 * pow(clamp(1.0 - v, 0.0, 1.0), 0.75) * smoothstep(0.0, 0.18, v);
  float n = auNoise(vec3(x * 6.0, v * 4.0 - t * 1.3, vPhase * 5.0));
  float body = 1.0 - smoothstep(w * 0.55, w, abs(x) + (n - 0.5) * 0.18);
  float fade = smoothstep(1.0, 0.45, v) * smoothstep(0.0, 0.08, v);
  float a = body * fade * vInt;
  if (a < 0.01) discard;
  if (uDark > 0.5) {
    gl_FragColor = vec4(uCore, a * 0.8);
    return;
  }
  float hot = 1.0 - smoothstep(0.0, w * 0.6, abs(x));
  vec3 col = mix(uRim, uBody, body);
  col = mix(col, uCore * 1.3, hot * (1.0 - v) * 0.6);
  gl_FragColor = vec4(col * 1.05, a * 0.7);
}`;

export class FlameCards {
  readonly mesh: THREE.Mesh;
  private pos: Float32Array;
  private prm: Float32Array;
  private dir: Float32Array;
  private anchors: { seg: number; t: number; ang: number; h: number; ph: number }[] = [];
  readonly uniforms: Record<string, THREE.IUniform>;
  private tmp = new THREE.Vector3();

  constructor(private segs: { bone: number; a: THREE.Vector3; b: THREE.Vector3; r: number }[], count: number, style: AuraStyle, dark: boolean) {
    const base = new THREE.PlaneGeometry(1, 1, 1, 4);
    base.translate(0, 0.5, 0);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index;
    geo.setAttribute('position', base.attributes.position);
    geo.setAttribute('uv', base.attributes.uv);
    this.pos = new Float32Array(count * 3);
    this.prm = new Float32Array(count * 4);
    this.dir = new Float32Array(count * 2);
    geo.setAttribute('aPos', new THREE.InstancedBufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aDir', new THREE.InstancedBufferAttribute(this.dir, 2).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aParam', new THREE.InstancedBufferAttribute(this.prm, 4).setUsage(THREE.DynamicDrawUsage));
    geo.instanceCount = count;
    // spread anchors over the proxies, weighted by length (torso/limbs), favouring upper edges
    const lens = segs.map((s) => s.a.distanceTo(s.b) + s.r);
    const total = lens.reduce((x, y) => x + y, 0);
    for (let i = 0; i < count; i++) {
      let r = Math.random() * total, k = 0;
      while (k < segs.length - 1 && r > lens[k]) r -= lens[k++];
      this.anchors.push({ seg: k, t: Math.random(), ang: Math.random() * Math.PI * 2, h: 0.6 + Math.random() * 0.8, ph: Math.random() });
    }
    this.uniforms = {
      uTime: { value: 0 },
      uCore: { value: new THREE.Color(dark ? style.dark ?? '#000' : style.core) },
      uBody: { value: new THREE.Color(style.body) },
      uRim: { value: new THREE.Color(style.rim) },
      uDark: { value: dark ? 1 : 0 },
    };
    const mat = new THREE.ShaderMaterial({
      vertexShader: CARD_VERT,
      fragmentShader: CARD_FRAG,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: dark ? THREE.NormalBlending : THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = dark ? 4 : 7;
  }

  setStyle(style: AuraStyle, dark: boolean): void {
    (this.uniforms.uCore.value as THREE.Color).set(dark ? style.dark ?? '#000' : style.core);
    (this.uniforms.uBody.value as THREE.Color).set(style.body);
    (this.uniforms.uRim.value as THREE.Color).set(style.rim);
  }

  update(bones: THREE.Bone[], level: number, time: number, scale = 1): void {
    this.uniforms.uTime.value = time;
    const lv = Math.max(0, level);
    const vis = Math.min(1, lv * 1.6);
    this.mesh.visible = vis > 0.02;
    if (!this.mesh.visible) return;
    const p = this.tmp;
    this.anchors.forEach((an, i) => {
      const s = this.segs[an.seg];
      p.lerpVectors(s.a, s.b, an.t).applyMatrix4(bones[s.bone].matrixWorld);
      const rr = s.r * 0.75;
      p.x += Math.cos(an.ang) * rr;
      p.z += Math.sin(an.ang) * rr;
      this.dir[i * 2] = Math.cos(an.ang);
      this.dir[i * 2 + 1] = Math.sin(an.ang);
      p.y -= 0.05;
      const flick = 0.75 + 0.5 * Math.sin(time * (5 + an.ph * 4) + an.ph * 40);
      const h = (0.35 + an.h * 0.55) * (0.5 + Math.min(lv, 2.2) * 0.55) * flick * scale;
      this.pos[i * 3] = p.x; this.pos[i * 3 + 1] = p.y; this.pos[i * 3 + 2] = p.z;
      this.prm[i * 4] = h * 0.42;
      this.prm[i * 4 + 1] = h;
      this.prm[i * 4 + 2] = an.ph;
      this.prm[i * 4 + 3] = vis * (0.55 + an.h * 0.3);
    });
    const g = this.mesh.geometry as THREE.InstancedBufferGeometry;
    g.attributes.aPos.needsUpdate = true;
    g.attributes.aParam.needsUpdate = true;
    g.attributes.aDir.needsUpdate = true;
  }
}
