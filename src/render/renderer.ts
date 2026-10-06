import * as THREE from 'three';
import {
  EffectComposer, RenderPass, EffectPass, BloomEffect, ToneMappingEffect, ToneMappingMode,
  SMAAEffect, VignetteEffect, ChromaticAberrationEffect, HueSaturationEffect, BrightnessContrastEffect,
} from 'postprocessing';
import { N8AOPostPass } from 'n8ao';
import { Sky, SKY_DAY, type SkyParams } from './sky';

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
  fogNear: 70,
  fogFar: 330,
  exposure: 1.0,
  saturation: 0.12,
  contrast: 0.06,
};

/** WebGL renderer + scene + post stack (N8AO → bloom → grading/tone mapping → vignette → SMAA). */
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
    this.sky.update(this.camera, this.atmo.sunDir, this.time);
    this.composer.render(dt);
  }
}
