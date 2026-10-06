import * as THREE from 'three';
import '@fontsource/dela-gothic-one';
import '@fontsource/yuji-syuku';
import '@fontsource/zen-kaku-gothic-new';
import { GameRenderer, QUALITY_HIGH, QUALITY_LOW } from './render/renderer';
import { buildPaletteTextures } from './render/palette';
import { createVoxelMaterial } from './render/voxelMaterial';
import { WorldRenderer } from './render/worldRenderer';
import { MeshPool } from './voxel/meshPool';
import { generateTestArena } from './maps/testArena';

const params = new URLSearchParams(location.search);

function boot(): void {
  const app = document.getElementById('app')!;
  const quality = params.get('q') === 'low' ? QUALITY_LOW : QUALITY_HIGH;
  const gr = new GameRenderer(app, quality);

  const t0 = performance.now();
  const world = generateTestArena(Number(params.get('seed') ?? 1));
  const genMs = performance.now() - t0;

  const { colors, params: matParams } = buildPaletteTextures(world.mats);
  const opaqueMat = createVoxelMaterial({ colors, params: matParams, voxelSize: world.vs });
  const transMat = createVoxelMaterial({ colors, params: matParams, voxelSize: world.vs, transparent: true });
  const pool = new MeshPool(world.mats.flags);
  const wr = new WorldRenderer(world, pool, opaqueMat, transMat);
  wr.markAllDirty();
  gr.scene.add(wr.group);

  // dev fly camera
  const cam = gr.camera;
  const camParam = params.get('cam');
  if (camParam) {
    const [x, y, z, tx, ty, tz] = camParam.split(',').map(Number);
    cam.position.set(x, y, z);
    cam.lookAt(tx, ty, tz);
  } else {
    cam.position.set(30, 14, 22);
    cam.lookAt(42, 5, 52);
  }
  const fly = new FlyControls(cam, gr.renderer.domElement);

  let last = performance.now();
  let frames = 0;
  const loop = () => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    fly.update(dt);
    wr.update(cam.position, 32, 48);
    gr.updateSun(cam.position.clone().add(cam.getWorldDirection(new THREE.Vector3()).multiplyScalar(18)));
    gr.render(dt);
    frames++;
    requestAnimationFrame(loop);
  };
  document.getElementById('boot')?.remove();
  requestAnimationFrame(loop);

  // debug / screenshot API
  (window as unknown as { __reishi: unknown }).__reishi = {
    ready: () => wr.pending === 0 && frames > 2,
    stats: () => ({
      genMs: Math.round(genMs),
      memMB: +(world.memoryBytes() / 1048576).toFixed(1),
      chunks: world.chunks.filter(Boolean).length,
      meshed: wr.stats.chunksMeshed,
      drawCalls: gr.renderer.info.render.calls,
      tris: gr.renderer.info.render.triangles,
      workers: pool.size,
    }),
    setCam: (x: number, y: number, z: number, tx: number, ty: number, tz: number) => {
      cam.position.set(x, y, z);
      cam.lookAt(tx, ty, tz);
    },
    world,
    renderer: gr,
  };
}

/** Minimal dev fly camera: WASD/QE + mouse drag. */
class FlyControls {
  private keys = new Set<string>();
  private yaw = 0;
  private pitch = 0;
  private dragging = false;

  constructor(private cam: THREE.PerspectiveCamera, el: HTMLElement) {
    const e = new THREE.Euler().setFromQuaternion(cam.quaternion, 'YXZ');
    this.yaw = e.y;
    this.pitch = e.x;
    window.addEventListener('keydown', (ev) => this.keys.add(ev.code));
    window.addEventListener('keyup', (ev) => this.keys.delete(ev.code));
    el.addEventListener('mousedown', () => (this.dragging = true));
    window.addEventListener('mouseup', () => (this.dragging = false));
    window.addEventListener('mousemove', (ev) => {
      if (!this.dragging) return;
      this.yaw -= ev.movementX * 0.003;
      this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch - ev.movementY * 0.003));
    });
  }

  update(dt: number): void {
    if (this.keys.size === 0 && !this.dragging) return;
    this.cam.quaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
    const speed = (this.keys.has('ShiftLeft') ? 40 : 12) * dt;
    const f = new THREE.Vector3(0, 0, -1).applyQuaternion(this.cam.quaternion);
    const r = new THREE.Vector3(1, 0, 0).applyQuaternion(this.cam.quaternion);
    if (this.keys.has('KeyW')) this.cam.position.addScaledVector(f, speed);
    if (this.keys.has('KeyS')) this.cam.position.addScaledVector(f, -speed);
    if (this.keys.has('KeyD')) this.cam.position.addScaledVector(r, speed);
    if (this.keys.has('KeyA')) this.cam.position.addScaledVector(r, -speed);
    if (this.keys.has('KeyE')) this.cam.position.y += speed;
    if (this.keys.has('KeyQ')) this.cam.position.y -= speed;
  }
}

boot();
