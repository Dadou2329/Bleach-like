// Billboard sprite particles (dust, smoke, sparks, embers, reishi motes, petals of light).
// One instanced quad mesh per blend mode; CPU simulation, GPU billboarding.
import * as THREE from 'three';

export const TEX_PUFF = 0;
export const TEX_GLOW = 1;
export const TEX_STREAK = 2;
export const TEX_RING = 3;

export interface SpriteSpawn {
  x: number; y: number; z: number;
  vx?: number; vy?: number; vz?: number;
  size: number;
  sizeEnd?: number;
  life: number;
  r: number; g: number; b: number;
  alpha?: number;
  alphaEnd?: number;
  rot?: number;
  spin?: number;
  drag?: number;
  gravity?: number;
  tex?: number;
  /** streaks: stretch along velocity */
  stretch?: number;
}

let atlasTex: THREE.CanvasTexture | null = null;

/** 2×2 procedural atlas: puff, glow, streak, ring. */
export function spriteAtlas(): THREE.Texture {
  if (atlasTex) return atlasTex;
  const S = 128;
  const c = document.createElement('canvas');
  c.width = c.height = S * 2;
  const g = c.getContext('2d')!;
  // puff: layered noisy blobs
  const puff = (ox: number, oy: number) => {
    const img = g.createImageData(S, S);
    for (let y = 0; y < S; y++)
      for (let x = 0; x < S; x++) {
        const dx = (x - S / 2) / (S / 2), dy = (y - S / 2) / (S / 2);
        const r = Math.sqrt(dx * dx + dy * dy);
        let n = 0, a = 0.5, f = 3;
        for (let o = 0; o < 4; o++) {
          n += a * (Math.sin(x * 0.11 * f + Math.cos(y * 0.07 * f) * 2) * 0.5 + 0.5) * (Math.cos(y * 0.13 * f + Math.sin(x * 0.05 * f) * 2) * 0.5 + 0.5);
          a *= 0.5; f *= 2.1;
        }
        const alpha = Math.max(0, 1 - r) ** 1.6 * (0.55 + 0.6 * n);
        const i = (y * S + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
        img.data[i + 3] = Math.min(255, alpha * 255);
      }
    g.putImageData(img, ox, oy);
  };
  puff(0, 0);
  // glow
  let grad = g.createRadialGradient(S * 1.5, S * 0.5, 0, S * 1.5, S * 0.5, S * 0.5);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.65)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(S, 0, S, S);
  // streak
  grad = g.createLinearGradient(0, S * 1.5, S, S * 1.5);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.5, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.beginPath();
  g.ellipse(S * 0.5, S * 1.5, S * 0.5, S * 0.12, 0, 0, Math.PI * 2);
  g.fill();
  // ring
  grad = g.createRadialGradient(S * 1.5, S * 1.5, S * 0.3, S * 1.5, S * 1.5, S * 0.5);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.6, 'rgba(255,255,255,0.9)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(S, S, S, S);
  atlasTex = new THREE.CanvasTexture(c);
  atlasTex.colorSpace = THREE.SRGBColorSpace;
  return atlasTex;
}

export class SpriteSystem {
  readonly mesh: THREE.Mesh;
  readonly capacity: number;
  count = 0;
  private iPos: THREE.InstancedBufferAttribute;
  private iVel: THREE.InstancedBufferAttribute;
  private iCol: THREE.InstancedBufferAttribute;
  private iMisc: THREE.InstancedBufferAttribute; // size, rot, tex, stretch
  private s: {
    vel: Float32Array; life: Float32Array; maxLife: Float32Array; size0: Float32Array; size1: Float32Array;
    a0: Float32Array; a1: Float32Array; spin: Float32Array; drag: Float32Array; grav: Float32Array;
  };

  constructor(capacity: number, additive: boolean) {
    this.capacity = capacity;
    const quad = new THREE.InstancedBufferGeometry();
    quad.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
    quad.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
    quad.setIndex([0, 1, 2, 0, 2, 3]);
    this.iPos = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3).setUsage(THREE.DynamicDrawUsage) as THREE.InstancedBufferAttribute;
    this.iVel = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3).setUsage(THREE.DynamicDrawUsage) as THREE.InstancedBufferAttribute;
    this.iCol = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4).setUsage(THREE.DynamicDrawUsage) as THREE.InstancedBufferAttribute;
    this.iMisc = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4).setUsage(THREE.DynamicDrawUsage) as THREE.InstancedBufferAttribute;
    quad.setAttribute('iPos', this.iPos);
    quad.setAttribute('iVel', this.iVel);
    quad.setAttribute('iCol', this.iCol);
    quad.setAttribute('iMisc', this.iMisc);
    quad.instanceCount = 0;
    const f = () => new Float32Array(capacity);
    this.s = { vel: new Float32Array(capacity * 3), life: f(), maxLife: f(), size0: f(), size1: f(), a0: f(), a1: f(), spin: f(), drag: f(), grav: f() };
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTex: { value: spriteAtlas() }, fogColor: { value: new THREE.Color() }, fogNear: { value: 80 }, fogFar: { value: 320 } },
      transparent: true,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      fog: true,
      vertexShader: /* glsl */ `
        attribute vec3 iPos; attribute vec3 iVel; attribute vec4 iCol; attribute vec4 iMisc;
        varying vec2 vUv; varying vec4 vCol; varying float vFogDepth;
        void main() {
          float size = iMisc.x, rot = iMisc.y, tex = iMisc.z, stretch = iMisc.w;
          vec4 mv = modelViewMatrix * vec4(iPos, 1.0);
          vec2 corner = position.xy;
          if (stretch > 0.0) {
            // align with projected velocity
            vec3 vv = (modelViewMatrix * vec4(iVel, 0.0)).xyz;
            vec2 d = length(vv.xy) > 1e-4 ? normalize(vv.xy) : vec2(1.0, 0.0);
            vec2 n = vec2(-d.y, d.x);
            float len = 1.0 + stretch * length(iVel) * 0.05;
            corner = d * corner.x * len + n * corner.y * 0.35;
          } else {
            float c = cos(rot), s = sin(rot);
            corner = vec2(c * corner.x - s * corner.y, s * corner.x + c * corner.y);
          }
          mv.xy += corner * size;
          vFogDepth = -mv.z;
          gl_Position = projectionMatrix * mv;
          // atlas cell (x, canvas row); CanvasTexture is flipped so row 0 is the top half
          vec2 cell = vec2(mod(tex, 2.0), floor(tex / 2.0));
          vUv = vec2((uv.x + cell.x) * 0.5, (uv.y + 1.0 - cell.y) * 0.5);
          vCol = iCol;
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uTex; uniform vec3 fogColor; uniform float fogNear, fogFar;
        varying vec2 vUv; varying vec4 vCol; varying float vFogDepth;
        void main() {
          vec4 t = texture2D(uTex, vUv);
          float a = t.a * vCol.a;
          if (a < 0.004) discard;
          vec3 c = vCol.rgb;
          ${additive ? '' : 'float fog = smoothstep(fogNear, fogFar, vFogDepth); c = mix(c, fogColor, fog);'}
          gl_FragColor = vec4(c, a);
        }`,
    });
    this.mesh = new THREE.Mesh(quad, mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = additive ? 20 : 10;
  }

  setFog(color: THREE.Color, near: number, far: number): void {
    const u = (this.mesh.material as THREE.ShaderMaterial).uniforms;
    u.fogColor.value.copy(color);
    u.fogNear.value = near;
    u.fogFar.value = far;
  }

  spawn(p: SpriteSpawn): void {
    let i = this.count;
    if (i >= this.capacity) i = Math.floor(Math.random() * this.capacity);
    else this.count++;
    const s = this.s;
    const pos = this.iPos.array as Float32Array, col = this.iCol.array as Float32Array, misc = this.iMisc.array as Float32Array;
    pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
    s.vel[i * 3] = p.vx ?? 0; s.vel[i * 3 + 1] = p.vy ?? 0; s.vel[i * 3 + 2] = p.vz ?? 0;
    s.life[i] = s.maxLife[i] = p.life;
    s.size0[i] = p.size; s.size1[i] = p.sizeEnd ?? p.size;
    s.a0[i] = p.alpha ?? 1; s.a1[i] = p.alphaEnd ?? 0;
    s.spin[i] = p.spin ?? 0; s.drag[i] = p.drag ?? 1; s.grav[i] = p.gravity ?? 0;
    col[i * 4] = p.r; col[i * 4 + 1] = p.g; col[i * 4 + 2] = p.b; col[i * 4 + 3] = s.a0[i];
    misc[i * 4] = p.size; misc[i * 4 + 1] = p.rot ?? Math.random() * 6.28; misc[i * 4 + 2] = p.tex ?? TEX_PUFF; misc[i * 4 + 3] = p.stretch ?? 0;
  }

  private kill(i: number): void {
    const j = --this.count;
    if (i === j) return;
    const s = this.s;
    const copy = (a: Float32Array, n: number) => { for (let k = 0; k < n; k++) a[i * n + k] = a[j * n + k]; };
    copy(this.iPos.array as Float32Array, 3);
    copy(this.iCol.array as Float32Array, 4);
    copy(this.iMisc.array as Float32Array, 4);
    copy(s.vel, 3);
    for (const a of [s.life, s.maxLife, s.size0, s.size1, s.a0, s.a1, s.spin, s.drag, s.grav]) a[i] = a[j];
  }

  update(dt: number): void {
    const s = this.s;
    const pos = this.iPos.array as Float32Array, col = this.iCol.array as Float32Array, misc = this.iMisc.array as Float32Array;
    const vel = this.iVel.array as Float32Array;
    for (let i = 0; i < this.count; i++) {
      s.life[i] -= dt;
      if (s.life[i] <= 0) { this.kill(i); i--; continue; }
      const t = 1 - s.life[i] / s.maxLife[i];
      const drag = Math.exp(-s.drag[i] * dt);
      s.vel[i * 3] *= drag; s.vel[i * 3 + 1] = s.vel[i * 3 + 1] * drag + s.grav[i] * dt; s.vel[i * 3 + 2] *= drag;
      pos[i * 3] += s.vel[i * 3] * dt; pos[i * 3 + 1] += s.vel[i * 3 + 1] * dt; pos[i * 3 + 2] += s.vel[i * 3 + 2] * dt;
      vel[i * 3] = s.vel[i * 3]; vel[i * 3 + 1] = s.vel[i * 3 + 1]; vel[i * 3 + 2] = s.vel[i * 3 + 2];
      misc[i * 4] = s.size0[i] + (s.size1[i] - s.size0[i]) * (1 - (1 - t) * (1 - t));
      misc[i * 4 + 1] += s.spin[i] * dt;
      // fade in quickly, then toward a1
      const fin = Math.min(1, t * 12);
      col[i * 4 + 3] = (s.a0[i] + (s.a1[i] - s.a0[i]) * t) * fin;
    }
    const g = this.mesh.geometry as THREE.InstancedBufferGeometry;
    g.instanceCount = this.count;
    for (const a of [this.iPos, this.iVel, this.iCol, this.iMisc]) {
      a.needsUpdate = true;
      a.clearUpdateRanges();
      a.addUpdateRange(0, this.count * a.itemSize);
    }
  }
}
