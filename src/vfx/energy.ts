// Smooth energy shapes: crescent (Getsuga), shockwave ring. Additive shaders with a hot core at the
// leading edge, the owner's colour in the body and a coloured rim; dark variants (Black Getsuga) add an
// alpha-blended near-black layer.
import * as THREE from 'three';

const NOISE = /* glsl */ `
float enHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float enNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(enHash(i), enHash(i + vec2(1, 0)), f.x), mix(enHash(i + vec2(0, 1)), enHash(i + vec2(1, 1)), f.x), f.y);
}
float enFbm(vec2 p) { return enNoise(p) * 0.6 + enNoise(p * 2.3) * 0.3 + enNoise(p * 5.1) * 0.1; }
`;

/**
 * Crescent band in local space: arc around the origin in the XZ plane (Z = forward at φ = 0, X = side),
 * angles −A..A, radial band from r−inner to r+outer (tapering at the horns), thin along Y.
 * uv.x = position along the arc (0..1), uv.y = 0 at the leading (outer) edge → 1 at the inner edge.
 */
export function crescentGeometry(r: number, A: number, outer: number, inner: number, thick: number, segs = 48, rings = 6): THREE.BufferGeometry {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  // two layers (top/bottom of the thin blade) so it has a little volume from oblique views
  for (const layer of [-1, 1]) {
    const base = pos.length / 3;
    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      const phi = -A + u * 2 * A;
      const taper = Math.max(0, 1 - Math.pow(Math.abs(phi) / A, 2.4));
      const ca = Math.cos(phi), sa = Math.sin(phi);
      for (let j = 0; j <= rings; j++) {
        const v = j / rings;
        const rr = r + outer * taper - (outer + inner) * taper * v;
        const y = layer * thick * taper * (1 - v * 0.7);
        pos.push(sa * rr, y, ca * rr);
        uv.push(u, v);
      }
    }
    for (let i = 0; i < segs; i++)
      for (let j = 0; j < rings; j++) {
        const a = base + i * (rings + 1) + j, b = a + rings + 1;
        if (layer > 0) idx.push(a, b, a + 1, b, b + 1, a + 1);
        else idx.push(a, a + 1, b, b, a + 1, b + 1);
      }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export interface EnergyColors {
  core: THREE.ColorRepresentation;
  body: THREE.ColorRepresentation;
  rim: THREE.ColorRepresentation;
  dark?: THREE.ColorRepresentation;
}

export const GETSUGA_BLUE: EnergyColors = { core: '#F9FFFF', body: '#7DDFFD', rim: '#2D74D0' };
export const GETSUGA_GOLD: EnergyColors = { core: '#FDFFD9', body: '#F4D761', rim: '#C6923D' };
export const GETSUGA_BLACK: EnergyColors = { core: '#FF6E86', body: '#C2304F', rim: '#8E1F3F', dark: '#050203' };

export function crescentMaterial(c: EnergyColors, dark = false): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uA: { value: 1 },
      uCore: { value: new THREE.Color(dark ? c.dark ?? '#000' : c.core) },
      uBody: { value: new THREE.Color(c.body) },
      uRim: { value: new THREE.Color(c.rim) },
      uDark: { value: dark ? 1 : 0 },
    },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uA; uniform vec3 uCore; uniform vec3 uBody; uniform vec3 uRim; uniform float uDark;
      varying vec2 vUv;
      ${NOISE}
      void main() {
        float horn = 1.0 - pow(abs(vUv.x * 2.0 - 1.0), 3.0);
        float n = enFbm(vec2(vUv.x * 9.0 - uTime * 1.5, vUv.y * 3.0 + uTime * 6.0));
        // flame erosion toward the inner edge
        float body = smoothstep(1.0, 0.15, vUv.y + (n - 0.5) * 0.7);
        float edge = smoothstep(0.32, 0.0, vUv.y);
        if (uDark > 0.5) {
          float a = body * horn * uA * 0.9 * smoothstep(0.0, 0.25, vUv.y + 0.1);
          if (a < 0.02) discard;
          gl_FragColor = vec4(uCore, a);
          return;
        }
        vec3 col = mix(uRim, uBody, body) ;
        col = mix(col, uCore * 2.2, edge * edge);
        float a = (body * 0.75 + edge) * horn * uA;
        if (a < 0.003) discard;
        gl_FragColor = vec4(col * 2.4, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: dark ? THREE.NormalBlending : THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

/** Expanding ground ring (slams, releases, landings). */
export class ShockRing {
  readonly mesh: THREE.Mesh;
  private t = 0;
  private dur: number;
  private r0: number;
  private r1: number;
  private u: Record<string, THREE.IUniform>;
  done = false;

  constructor(pos: THREE.Vector3, r1: number, color: THREE.ColorRepresentation, dur = 0.45, r0 = 0.3) {
    this.dur = dur;
    this.r0 = r0;
    this.r1 = r1;
    this.u = { uT: { value: 0 }, uCol: { value: new THREE.Color(color) } };
    const g = new THREE.RingGeometry(0.82, 1, 64, 1);
    g.rotateX(-Math.PI / 2);
    this.mesh = new THREE.Mesh(
      g,
      new THREE.ShaderMaterial({
        uniforms: this.u,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform float uT; uniform vec3 uCol; varying vec2 vUv;
          void main() { float a = (1.0 - uT) * (1.0 - uT); gl_FragColor = vec4(uCol * 2.0, a * 0.9); }`,
      }),
    );
    this.mesh.position.copy(pos);
    this.mesh.position.y += 0.05;
    this.mesh.renderOrder = 6;
    this.mesh.frustumCulled = false;
  }

  update(dt: number): void {
    this.t += dt / this.dur;
    if (this.t >= 1) {
      this.done = true;
      this.mesh.visible = false;
      return;
    }
    const e = 1 - Math.pow(1 - this.t, 3);
    const r = this.r0 + (this.r1 - this.r0) * e;
    this.mesh.scale.set(r, 1, r);
    this.u.uT.value = this.t;
  }
}
