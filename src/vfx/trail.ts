// Sword trail ribbon: samples a blade segment (base → tip) every frame while emitting and draws the
// last samples as a fading additive ribbon — bright near the blade, thinning to nothing.
import * as THREE from 'three';

const VERT = /* glsl */ `
attribute float aAge;
attribute float aSide;
varying float vAge;
varying float vSide;
void main() {
  vAge = aAge;
  vSide = aSide;
  gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
}`;

const FRAG = /* glsl */ `
uniform vec3 uCore;
uniform vec3 uColor;
uniform float uIntensity;
varying float vAge;
varying float vSide;
void main() {
  float a = 1.0 - vAge;
  if (a <= 0.0) discard;
  // brighter toward the tip side, hot core near the newest sample
  float edge = smoothstep(0.0, 1.0, vSide);
  vec3 c = mix(uColor, uCore, pow(a, 3.0) * 0.8 + edge * 0.2);
  float alpha = pow(a, 1.3) * mix(0.35, 1.0, edge);
  gl_FragColor = vec4(c * uIntensity, alpha);
}`;

export class SwordTrail {
  readonly mesh: THREE.Mesh;
  private n: number;
  private base: Float32Array;
  private tip: Float32Array;
  private time: Float32Array;
  private count = 0;
  private head = 0;
  emitting = false;
  /** seconds a sample lives */
  life = 0.16;
  private geo: THREE.BufferGeometry;
  private pos: Float32Array;
  private age: Float32Array;
  private now = 0;
  readonly uniforms: { uCore: { value: THREE.Color }; uColor: { value: THREE.Color }; uIntensity: { value: number } };

  constructor(samples = 28, color: THREE.ColorRepresentation = '#9fd8ff', core: THREE.ColorRepresentation = '#ffffff') {
    this.n = samples;
    this.base = new Float32Array(samples * 3);
    this.tip = new Float32Array(samples * 3);
    this.time = new Float32Array(samples);
    this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(samples * 2 * 3);
    this.age = new Float32Array(samples * 2);
    const side = new Float32Array(samples * 2);
    for (let i = 0; i < samples; i++) { side[i * 2] = 0; side[i * 2 + 1] = 1; }
    const idx: number[] = [];
    for (let i = 0; i < samples - 1; i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      idx.push(a, b, c, b, d, c);
    }
    this.geo.setIndex(idx);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aAge', new THREE.BufferAttribute(this.age, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aSide', new THREE.BufferAttribute(side, 1));
    this.uniforms = { uCore: { value: new THREE.Color(core) }, uColor: { value: new THREE.Color(color) }, uIntensity: { value: 3.0 } };
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(this.geo, mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
  }

  setColor(color: THREE.ColorRepresentation, core?: THREE.ColorRepresentation): void {
    this.uniforms.uColor.value.set(color);
    if (core) this.uniforms.uCore.value.set(core);
  }

  /** Forget the samples (the blade changed hands or weapons: no streak from the old one to the new). */
  reset(): void {
    this.count = 0;
  }

  /** Feed the blade segment for this frame. */
  update(dt: number, base: THREE.Vector3, tip: THREE.Vector3): void {
    this.now += dt;
    if (this.emitting) {
      // insert new sample (and densify fast swings with interpolated in-betweens)
      const last = (this.head - 1 + this.n) % this.n;
      const steps = this.count > 0 ? Math.min(4, Math.max(1, Math.round(tip.distanceTo(new THREE.Vector3(this.tip[last * 3], this.tip[last * 3 + 1], this.tip[last * 3 + 2])) / 0.25))) : 1;
      const pb = this.count > 0 ? [this.base[last * 3], this.base[last * 3 + 1], this.base[last * 3 + 2]] : [base.x, base.y, base.z];
      const pt = this.count > 0 ? [this.tip[last * 3], this.tip[last * 3 + 1], this.tip[last * 3 + 2]] : [tip.x, tip.y, tip.z];
      for (let s = 1; s <= steps; s++) {
        const k = s / steps;
        const i = this.head;
        this.base[i * 3] = pb[0] + (base.x - pb[0]) * k; this.base[i * 3 + 1] = pb[1] + (base.y - pb[1]) * k; this.base[i * 3 + 2] = pb[2] + (base.z - pb[2]) * k;
        this.tip[i * 3] = pt[0] + (tip.x - pt[0]) * k; this.tip[i * 3 + 1] = pt[1] + (tip.y - pt[1]) * k; this.tip[i * 3 + 2] = pt[2] + (tip.z - pt[2]) * k;
        this.time[i] = this.now - dt * (1 - k);
        this.head = (this.head + 1) % this.n;
        this.count = Math.min(this.n, this.count + 1);
      }
    }
    // rebuild geometry newest → oldest
    for (let j = 0; j < this.n; j++) {
      const i = (this.head - 1 - j + this.n * 2) % this.n;
      const valid = j < this.count;
      const ageN = valid ? Math.min(1, (this.now - this.time[i]) / this.life) : 1;
      const src = valid ? i : (this.head - 1 + this.n) % this.n;
      this.pos.set([this.base[src * 3], this.base[src * 3 + 1], this.base[src * 3 + 2]], j * 6);
      this.pos.set([this.tip[src * 3], this.tip[src * 3 + 1], this.tip[src * 3 + 2]], j * 6 + 3);
      this.age[j * 2] = ageN;
      this.age[j * 2 + 1] = ageN;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.aAge.needsUpdate = true;
    this.mesh.visible = this.count > 0 && this.now - this.time[(this.head - 1 + this.n) % this.n] < this.life;
  }
}
