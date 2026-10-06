import * as THREE from 'three';

export interface SkyParams {
  zenith: THREE.ColorRepresentation;
  horizon: THREE.ColorRepresentation;
  ground: THREE.ColorRepresentation;
  sunColor: THREE.ColorRepresentation;
  sunSize: number; // 0..1 disc size
  sunGlow: number;
  cloudColor: THREE.ColorRepresentation;
  cloudCover: number; // 0..1
  stars: number; // 0..1
  moon: boolean;
}

export const SKY_DAY: SkyParams = {
  zenith: '#3f7fd0', horizon: '#bcd8f0', ground: '#8a8f94', sunColor: '#fff4dc',
  sunSize: 0.012, sunGlow: 0.6, cloudColor: '#ffffff', cloudCover: 0.42, stars: 0, moon: false,
};

export const SKY_DUSK: SkyParams = {
  zenith: '#27406e', horizon: '#f2a066', ground: '#4a3a3a', sunColor: '#ffcf8a',
  sunSize: 0.02, sunGlow: 1.1, cloudColor: '#f6b98a', cloudCover: 0.5, stars: 0.1, moon: false,
};

export const SKY_HUECO: SkyParams = {
  zenith: '#04050a', horizon: '#1a1e2e', ground: '#0c0d12', sunColor: '#f2f4ff',
  sunSize: 0.03, sunGlow: 0.35, cloudColor: '#202436', cloudCover: 0.1, stars: 0.9, moon: true,
};

/** Gradient sky dome with sun/moon disc, procedural clouds and stars. Rendered behind everything. */
export class Sky {
  readonly mesh: THREE.Mesh;
  readonly uniforms: Record<string, THREE.IUniform>;

  constructor(params: SkyParams = SKY_DAY) {
    this.uniforms = {
      uZenith: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uGround: { value: new THREE.Color() },
      uSunColor: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3(0.4, 0.8, 0.3).normalize() },
      uSunSize: { value: 0.01 },
      uSunGlow: { value: 0.5 },
      uCloudColor: { value: new THREE.Color() },
      uCloudCover: { value: 0.4 },
      uStars: { value: 0 },
      uMoon: { value: 0 },
      uTime: { value: 0 },
    };
    this.set(params);
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_Position = p.xyww; // at far plane
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uZenith, uHorizon, uGround, uSunColor, uCloudColor, uSunDir;
        uniform float uSunSize, uSunGlow, uCloudCover, uStars, uMoon, uTime;
        varying vec3 vDir;
        float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
        float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
          return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
        float fbm(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<5;i++){ s+=a*n2(p); p*=2.03; a*=0.5;} return s; }
        void main() {
          vec3 d = normalize(vDir);
          float y = d.y;
          vec3 col = y > 0.0 ? mix(uHorizon, uZenith, pow(y, 0.55)) : mix(uHorizon, uGround, pow(-y, 0.35));
          // sun / moon
          float sd = dot(d, normalize(uSunDir));
          float disc = smoothstep(1.0 - uSunSize, 1.0 - uSunSize * 0.6, sd);
          float glow = pow(max(sd, 0.0), 64.0) * uSunGlow + pow(max(sd, 0.0), 6.0) * uSunGlow * 0.25;
          if (uMoon > 0.5) {
            // crescent: subtract an offset disc
            vec3 off = normalize(uSunDir + vec3(0.025, 0.012, 0.0));
            float cut = smoothstep(1.0 - uSunSize, 1.0 - uSunSize * 0.6, dot(d, off));
            disc = max(disc - cut, 0.0);
          }
          col += uSunColor * (disc * 4.0 + glow);
          // clouds on a virtual plane
          if (y > 0.02 && uCloudCover > 0.0) {
            vec2 uv = d.xz / (y + 0.08) * 1.6 + vec2(uTime * 0.004, uTime * 0.002);
            float c = fbm(uv * 0.9);
            float cover = smoothstep(1.0 - uCloudCover, 1.0 - uCloudCover + 0.25, c);
            float shade = 0.75 + 0.35 * fbm(uv * 1.9 + 3.0);
            col = mix(col, uCloudColor * shade, cover * smoothstep(0.02, 0.2, y) * 0.9);
          }
          // stars
          if (uStars > 0.0 && y > 0.0) {
            vec2 sp = d.xz / (y + 1.0) * 220.0;
            float st = step(0.9975, h21(floor(sp))) * smoothstep(0.0, 0.3, y);
            col += vec3(st) * uStars * (0.6 + 0.4 * sin(uTime * 2.0 + h21(floor(sp)) * 40.0));
          }
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), mat);
    this.mesh.renderOrder = -1000;
    this.mesh.frustumCulled = false;
    this.mesh.scale.setScalar(4000);
  }

  set(p: SkyParams): void {
    this.uniforms.uZenith.value.set(p.zenith);
    this.uniforms.uHorizon.value.set(p.horizon);
    this.uniforms.uGround.value.set(p.ground);
    this.uniforms.uSunColor.value.set(p.sunColor);
    this.uniforms.uSunSize.value = p.sunSize;
    this.uniforms.uSunGlow.value = p.sunGlow;
    this.uniforms.uCloudColor.value.set(p.cloudColor);
    this.uniforms.uCloudCover.value = p.cloudCover;
    this.uniforms.uStars.value = p.stars;
    this.uniforms.uMoon.value = p.moon ? 1 : 0;
  }

  update(camera: THREE.Camera, sunDir: THREE.Vector3, time: number): void {
    this.mesh.position.copy(camera.position);
    this.uniforms.uSunDir.value.copy(sunDir);
    this.uniforms.uTime.value = time;
  }
}
