import * as THREE from 'three';
import {
  EffectComposer, RenderPass, EffectPass, BloomEffect, ToneMappingEffect, ToneMappingMode, Effect,
  SMAAEffect, VignetteEffect, ChromaticAberrationEffect, HueSaturationEffect, BrightnessContrastEffect, BlendFunction,
} from 'postprocessing';
import { N8AOPostPass } from 'n8ao';
import { Sky, SKY_DAY, type SkyParams } from './sky';
import { setCharEnvMap } from './charMaterial';

export interface Quality {
  pixelRatio: number;
  shadowMap: number;
  shadowRange: number; // half-size of the sun's shadow box (m)
  ao: boolean;
  bloom: boolean;
  smaa: boolean;
}

export const QUALITY_HIGH: Quality = { pixelRatio: 1, shadowMap: 4096, shadowRange: 48, ao: true, bloom: true, smaa: true };
export const QUALITY_LOW: Quality = { pixelRatio: 0.75, shadowMap: 2048, shadowRange: 36, ao: false, bloom: true, smaa: false };

export interface Atmosphere {
  sky: SkyParams;
  sunDir: THREE.Vector3;
  sunColor: THREE.ColorRepresentation;
  sunIntensity: number;
  hemiSky: THREE.ColorRepresentation;
  hemiGround: THREE.ColorRepresentation;
  hemiIntensity: number;
  fogColor: THREE.ColorRepresentation;
  fogNear: number;
  fogFar: number;
  exposure: number;
  saturation: number; // -1..1
  contrast: number; // -1..1
}

export const ATMO_DAY: Atmosphere = {
  sky: SKY_DAY,
  sunDir: new THREE.Vector3(-0.45, 0.78, 0.35).normalize(),
  sunColor: '#fff1dc',
  sunIntensity: 3.1,
  hemiSky: '#cfe2ff',
  hemiGround: '#6e604e',
  hemiIntensity: 1.15,
  fogColor: '#b9d2ea',
  // the town is 320 m across: the haze starts past the next block and swallows the far side
  fogNear: 90,
  fogFar: 420,
  exposure: 1.0,
  saturation: 0.12,
  contrast: 0.06,
};

/**
 * Drops NaN / Inf pixels (and caps absurd HDR values) before the bloom: one bad pixel from any shader would
 * otherwise be smeared by the mip-chain blur into a black frame. The alpha is cleaned too — additive layers pile it
 * up past the half-float range (a wide additive pillar filling the view: Inf), and the blur spreads that just the
 * same. The result replaces the input outright (SRC): the default NORMAL blend mixes the input back in, and
 * mix(Inf, x, 1) is NaN.
 */
class NanGuardEffect extends Effect {
  constructor() {
    super('NanGuardEffect', /* glsl */ `
      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec3 c = inputColor.rgb;
        float a = inputColor.a;
        // comparisons with NaN are false, so this also catches NaN where isnan() is optimised away
        bool ok = abs(c.r) + abs(c.g) + abs(c.b) < 1e6 && !any(isnan(c)) && !any(isinf(c));
        bool aok = abs(a) < 1e6 && !isnan(a) && !isinf(a);
        outputColor = vec4(ok ? clamp(c, 0.0, 256.0) : vec3(0.0), aok ? clamp(a, 0.0, 1.0) : 1.0);
      }`, { blendFunction: BlendFunction.SRC });
  }
}

function finite3(v: THREE.Vector3): boolean {
  return Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
}

/** WebGL renderer + scene + post stack (N8AO → NaN guard → bloom → grading/tone mapping → vignette → SMAA). */
export class GameRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly composer: EffectComposer;
  readonly sun: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  readonly sky: Sky;
  readonly ao: N8AOPostPass | null = null;
  readonly bloom: BloomEffect;
  readonly chroma: ChromaticAberrationEffect;
  readonly hueSat: HueSaturationEffect;
  readonly brightness: BrightnessContrastEffect;
  readonly tone: ToneMappingEffect;
  quality: Quality;
  atmo: Atmosphere = ATMO_DAY;
  /** prefiltered sky/ground gradient for metals and glossy character parts */
  envMap: THREE.Texture | null = null;
  private pmrem: THREE.PMREMGenerator;
  private time = 0;
  private shadowTarget = new THREE.Vector3();

  constructor(container: HTMLElement, quality: Quality = QUALITY_HIGH) {
    this.quality = quality;
    const r = (this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    }));
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2) * quality.pixelRatio);
    r.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    r.toneMapping = THREE.NoToneMapping;
    r.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(r.domElement);
    // a lost context renders black until it is restored (a GPU watchdog reset on a very long frame): say so,
    // so captures that come out black can be told apart from a shader fault
    r.domElement.addEventListener('webglcontextlost', () => console.warn('[reishi] WebGL context lost'));
    r.domElement.addEventListener('webglcontextrestored', () => console.warn('[reishi] WebGL context restored'));
    this.pmrem = new THREE.PMREMGenerator(r);

    const w = r.domElement.width, h = r.domElement.height;
    this.camera = new THREE.PerspectiveCamera(62, w / h, 0.06, 2500);

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 3);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(quality.shadowMap, quality.shadowMap);
    const sc = this.sun.shadow.camera;
    sc.left = -quality.shadowRange; sc.right = quality.shadowRange;
    sc.top = quality.shadowRange; sc.bottom = -quality.shadowRange;
    sc.near = 1; sc.far = 400;
    this.sun.shadow.bias = -0.00025;
    this.sun.shadow.normalBias = 0.035;
    this.scene.add(this.sun, this.sun.target);
    this.sky = new Sky();
    this.scene.add(this.sky.mesh);
    this.scene.fog = new THREE.Fog(0xffffff, 80, 320);

    const composer = (this.composer = new EffectComposer(r, { frameBufferType: THREE.HalfFloatType }));
    composer.addPass(new RenderPass(this.scene, this.camera));
    if (quality.ao) {
      const ao = new N8AOPostPass(this.scene, this.camera, w, h);
      ao.configuration.aoRadius = 1.4;
      ao.configuration.distanceFalloff = 0.9;
      ao.configuration.intensity = 2.2;
      ao.configuration.gammaCorrection = false;
      ao.configuration.halfRes = true;
      ao.setQualityMode('Medium');
      composer.addPass(ao);
      (this as { ao: N8AOPostPass | null }).ao = ao;
    }
    this.bloom = new BloomEffect({ mipmapBlur: true, luminanceThreshold: 0.92, luminanceSmoothing: 0.18, intensity: 1.1, radius: 0.72 });
    this.chroma = new ChromaticAberrationEffect({ offset: new THREE.Vector2(0, 0), radialModulation: true, modulationOffset: 0.2 });
    this.hueSat = new HueSaturationEffect({ saturation: 0.1 });
    this.brightness = new BrightnessContrastEffect({ contrast: 0.05 });
    this.tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
    const vignette = new VignetteEffect({ darkness: 0.42, offset: 0.32 });
    // the bloom reads the raw input buffer, so the guard needs a pass of its own in front of it
    composer.addPass(new EffectPass(this.camera, new NanGuardEffect()));
    // convolution effects (chromatic aberration, SMAA) each need their own pass
    composer.addPass(new EffectPass(this.camera, this.bloom, this.tone, this.hueSat, this.brightness, vignette));
    composer.addPass(new EffectPass(this.camera, this.chroma));
    if (quality.smaa) composer.addPass(new EffectPass(this.camera, new SMAAEffect()));

    this.applyAtmosphere(ATMO_DAY);
    window.addEventListener('resize', () => this.resize());
  }

  applyAtmosphere(a: Atmosphere): void {
    this.atmo = a;
    this.sky.set(a.sky);
    this.sun.color.set(a.sunColor);
    this.sun.intensity = a.sunIntensity;
    this.hemi.color.set(a.hemiSky);
    this.hemi.groundColor.set(a.hemiGround);
    this.hemi.intensity = a.hemiIntensity;
    const fog = this.scene.fog as THREE.Fog;
    fog.color.set(a.fogColor);
    fog.near = a.fogNear;
    fog.far = a.fogFar;
    this.renderer.toneMappingExposure = a.exposure;
    this.hueSat.saturation = a.saturation;
    this.brightness.contrast = a.contrast;
    this.buildEnvMap(a);
  }

  /** Gradient environment (zenith → horizon → ground) with a bright sun spot, prefiltered once. */
  private buildEnvMap(a: Atmosphere): void {
    const geo = new THREE.SphereGeometry(10, 48, 24);
    const sky = new THREE.Color(a.hemiSky), hor = new THREE.Color(a.fogColor), gnd = new THREE.Color(a.hemiGround);
    const sun = new THREE.Color(a.sunColor).multiplyScalar(6);
    const col: number[] = [];
    const pos = geo.attributes.position;
    const c = new THREE.Color();
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).normalize();
      if (v.y >= 0) c.copy(hor).lerp(sky, Math.pow(v.y, 0.6));
      else c.copy(hor).lerp(gnd, Math.min(1, -v.y * 4));
      const sd = Math.max(0, v.dot(a.sunDir));
      c.lerp(sun, Math.pow(sd, 48) * 0.8);
      col.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    const rt = this.pmrem.fromScene(scene, 0.02);
    this.envMap?.dispose();
    this.envMap = rt.texture;
    setCharEnvMap(this.envMap);
    geo.dispose();
  }

  resize(): void {
    const el = this.renderer.domElement.parentElement;
    const w = el?.clientWidth || window.innerWidth, h = el?.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /** Keep the sun's shadow box centred on `target`, snapped to shadow texels to avoid shimmering. */
  updateSun(target: THREE.Vector3): void {
    // a non-finite target would put NaN in the shadow matrix and every shadowed pixel would go black
    if (!finite3(target)) {
      this.warnOnce('sun', `[reishi] non-finite shadow target ${target.toArray().join(',')}`);
      return;
    }
    const dir = this.atmo.sunDir;
    const range = this.quality.shadowRange;
    const texel = (range * 2) / this.quality.shadowMap;
    // snap in light space
    const lightRot = new THREE.Matrix4().lookAt(new THREE.Vector3(), dir.clone().negate(), new THREE.Vector3(0, 1, 0));
    const inv = lightRot.clone().invert();
    const p = target.clone().applyMatrix4(inv);
    p.x = Math.round(p.x / texel) * texel;
    p.y = Math.round(p.y / texel) * texel;
    this.shadowTarget.copy(p.applyMatrix4(lightRot));
    this.sun.target.position.copy(this.shadowTarget);
    this.sun.position.copy(this.shadowTarget).addScaledVector(dir, 160);
    this.sun.target.updateMatrixWorld();
  }

  render(dt: number): void {
    this.time += dt;
    this.guardFrame();
    this.sky.update(this.camera, this.atmo.sunDir, this.time);
    this.composer.render(dt);
  }

  private lastCam = { p: new THREE.Vector3(), q: new THREE.Quaternion(), fov: 62, ok: false };
  private warned = new Set<string>();

  private warnOnce(key: string, msg: string): void {
    if (this.warned.has(key)) return;
    this.warned.add(key);
    console.warn(msg);
  }

  /**
   * Whatever every pixel depends on must be finite: a NaN in the camera, in a light or in the sun turns the whole
   * frame black (the NaN guard can only black out the bad pixels, and here they are all bad). Fall back to the
   * last good camera, put out a broken light, and say which it was.
   */
  private guardFrame(): void {
    const cam = this.camera;
    if (!finite3(cam.position) || !Number.isFinite(cam.quaternion.x + cam.quaternion.y + cam.quaternion.z + cam.quaternion.w) || !Number.isFinite(cam.fov)) {
      this.warnOnce('camera', `[reishi] non-finite camera ${cam.position.toArray().join(',')} fov ${cam.fov}`);
      if (this.lastCam.ok) {
        cam.position.copy(this.lastCam.p);
        cam.quaternion.copy(this.lastCam.q);
        cam.fov = this.lastCam.fov;
        cam.updateProjectionMatrix();
        cam.updateMatrixWorld();
      }
    } else {
      this.lastCam.p.copy(cam.position);
      this.lastCam.q.copy(cam.quaternion);
      this.lastCam.fov = cam.fov;
      this.lastCam.ok = true;
    }
    for (const o of this.scene.children) this.guardLights(o);
  }

  private guardLights(o: THREE.Object3D): void {
    const l = o as THREE.Light;
    if (l.isLight && l.visible) {
      if (!finite3(o.position) || !Number.isFinite(l.intensity) || !l.matrixWorld.elements.every(Number.isFinite)) {
        this.warnOnce(`light:${o.name || o.type}`, `[reishi] non-finite light ${o.name || o.type} at ${o.position.toArray().join(',')} intensity ${l.intensity}`);
        l.intensity = 0;
        o.visible = false;
      }
    }
    for (const c of o.children) this.guardLights(c);
  }
}
