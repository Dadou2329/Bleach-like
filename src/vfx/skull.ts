// Kenpachi's reiatsu skull: when he fights all-out his golden aura takes the shape of a giant skull in
// his opponent's eyes. A tall card that turns to face the camera (about the vertical axis) and sits just
// behind him; the skull is drawn procedurally on a canvas (cranium, slanted sockets, nasal cavity, a
// row of teeth, cracks) and eaten by rising flame noise in the shader. Additive gold; the sockets and
// the gaps between the teeth stay dark because nothing is drawn there.
import * as THREE from 'three';
import type { Game, Projectile } from '../game/game';
import type { Fighter } from '../game/fighter';

let skullTex: THREE.CanvasTexture | null = null;

function skullShape(g: CanvasRenderingContext2D): void {
  g.beginPath();
  g.ellipse(128, 100, 84, 80, 0, 0, Math.PI * 2);
  g.fill();
  // cheekbones and the upper jaw
  g.beginPath();
  g.moveTo(50, 118);
  g.lineTo(206, 118);
  g.lineTo(194, 168);
  g.lineTo(170, 192);
  g.lineTo(86, 192);
  g.lineTo(62, 168);
  g.closePath();
  g.fill();
  // the lower jaw
  g.beginPath();
  g.moveTo(80, 186);
  g.lineTo(176, 186);
  g.lineTo(168, 226);
  g.quadraticCurveTo(128, 240, 88, 226);
  g.closePath();
  g.fill();
}

function skullHoles(g: CanvasRenderingContext2D): void {
  // eye sockets: big, slanted down toward the nose (a scowl)
  for (const s of [-1, 1]) {
    g.beginPath();
    g.ellipse(128 + s * 37, 124, 29, 23, s * 0.32, 0, Math.PI * 2);
    g.fill();
  }
  // nasal cavity: an inverted heart
  g.beginPath();
  g.moveTo(128, 148);
  g.lineTo(114, 176);
  g.quadraticCurveTo(128, 170, 128, 172);
  g.quadraticCurveTo(128, 170, 142, 176);
  g.closePath();
  g.fill();
  // the bite and the gaps between the teeth
  g.fillRect(84, 199, 88, 4);
  for (let x = 92; x <= 164; x += 12) g.fillRect(x - 1.5, 184, 3, 36);
  // cracks over the cranium
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(150, 30);
  g.lineTo(144, 52);
  g.lineTo(156, 66);
  g.lineTo(150, 84);
  g.moveTo(88, 44);
  g.lineTo(98, 62);
  g.lineTo(92, 74);
  g.stroke();
}

function skullTexture(): THREE.CanvasTexture {
  if (skullTex) return skullTex;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, 256, 256);
  g.fillStyle = '#ffffff';
  g.strokeStyle = '#ffffff';
  // soft halo of the silhouette, then the hard skull over it
  g.filter = 'blur(10px)';
  g.globalAlpha = 0.55;
  skullShape(g);
  g.filter = 'none';
  g.globalAlpha = 1;
  skullShape(g);
  // holes punched through both layers, with soft edges
  g.globalCompositeOperation = 'destination-out';
  g.filter = 'blur(3px)';
  skullHoles(g);
  g.filter = 'none';
  skullHoles(g);
  g.globalCompositeOperation = 'source-over';
  skullTex = new THREE.CanvasTexture(c);
  return skullTex;
}

const VERT = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAG = /* glsl */ `
uniform sampler2D uMap; uniform float uTime; uniform float uA; uniform vec3 uCol; uniform vec3 uCore;
varying vec2 vUv;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { return n2(p) * 0.55 + n2(p * 2.1) * 0.3 + n2(p * 4.7) * 0.15; }
void main() {
  vec2 uv = vUv;
  float n = fbm(vec2(uv.x * 5.0, uv.y * 3.0 - uTime * 1.2));
  uv.x += (n - 0.5) * 0.05 * (0.4 + uv.y);
  uv.y += (n - 0.5) * 0.025;
  float m = texture2D(uMap, uv).a;
  // flames streaming upward through the skull, hotter at the hard core
  float fl = fbm(vec2(uv.x * 9.0, uv.y * 3.5 - uTime * 2.4));
  float core = smoothstep(0.75, 1.0, m);
  float a = m * (0.35 + 0.8 * fl) * uA;
  vec3 col = mix(uCol, uCore, core * smoothstep(0.45, 0.95, fl));
  gl_FragColor = vec4(col * 1.7, a);
}`;

/** The skull card, owned by a fighter; lives as a projectile so the game renders it every frame. */
export class SkullAura implements Projectile {
  done = false;
  readonly mesh: THREE.Mesh;
  private u: Record<string, THREE.IUniform>;
  /** current and resting intensity; flare() lifts it for a while */
  level = 0;
  target = 0;
  private hold = 0;
  private holdLevel = 0;
  private time = 0;

  constructor(private g: Game, private f: Fighter, color: THREE.ColorRepresentation = '#F6C823', core: THREE.ColorRepresentation = '#FFF2B3', readonly height = 4.6) {
    this.u = { uMap: { value: skullTexture() }, uTime: { value: 0 }, uA: { value: 0 }, uCol: { value: new THREE.Color(color) }, uCore: { value: new THREE.Color(core) } };
    const geo = new THREE.PlaneGeometry(height * 0.92, height);
    this.mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    this.mesh.renderOrder = 5;
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    g.engine.gr.scene.add(this.mesh);
  }

  setColor(color: THREE.ColorRepresentation, core: THREE.ColorRepresentation): void {
    (this.u.uCol.value as THREE.Color).set(color);
    (this.u.uCore.value as THREE.Color).set(core);
  }

  /** Lift the skull to `level` for `seconds`. */
  flare(level: number, seconds: number): void {
    this.holdLevel = Math.max(this.hold > 0 ? this.holdLevel : 0, level);
    this.hold = Math.max(this.hold, seconds);
    this.level = Math.max(this.level, level * 0.6);
  }

  update(): void {
    if (!this.g.fighters.includes(this.f)) this.done = true;
  }

  render(dt: number): void {
    this.time += dt;
    this.hold = Math.max(0, this.hold - dt);
    const goal = this.f.dead ? 0 : this.hold > 0 ? Math.max(this.target, this.holdLevel) : this.target;
    this.level += (goal - this.level) * (1 - Math.exp(-(goal > this.level ? 7 : 2) * dt));
    this.mesh.visible = this.level > 0.01;
    if (!this.mesh.visible) return;
    // behind him as seen from the camera, turned to face it
    const cam = this.g.engine.gr.camera.position;
    const p = this.f.renderPos;
    const dx = p.x - cam.x, dz = p.z - cam.z;
    const dl = Math.hypot(dx, dz) || 1;
    const k = 0.7 + this.level * 0.2;
    this.mesh.position.set(p.x + (dx / dl) * 0.9, p.y + this.f.def.height * 0.62 + this.height * 0.3 * k, p.z + (dz / dl) * 0.9);
    this.mesh.rotation.set(0, Math.atan2(-dx, -dz), 0);
    this.mesh.scale.setScalar(k);
    this.u.uTime.value = this.time;
    this.u.uA.value = Math.min(1.2, this.level) * (0.85 + Math.sin(this.time * 9) * 0.08 + Math.sin(this.time * 23) * 0.05);
  }

  dispose(): void {
    this.mesh.removeFromParent();
    (this.mesh.material as THREE.Material).dispose();
    this.mesh.geometry.dispose();
  }
}
