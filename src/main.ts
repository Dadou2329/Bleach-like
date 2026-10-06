import * as THREE from 'three';
import '@fontsource/dela-gothic-one';
import '@fontsource/yuji-syuku';
import '@fontsource/zen-kaku-gothic-new';
import { QUALITY_HIGH, QUALITY_LOW } from './render/renderer';
import { generateTestArena } from './maps/testArena';
import { Engine } from './engine';
import { raycastVoxels } from './voxel/raycast';
import { BoxShape, CapsuleShape, CrescentShape, SphereShape } from './destruction/shapes';

const params = new URLSearchParams(location.search);

async function boot(): Promise<void> {
  const app = document.getElementById('app')!;
  const quality = params.get('q') === 'low' ? QUALITY_LOW : QUALITY_HIGH;
  const t0 = performance.now();
  const world = generateTestArena(Number(params.get('seed') ?? 1));
  const genMs = performance.now() - t0;
  const eng = await Engine.create(app, world, quality);
  const cam = eng.gr.camera;
  const camParam = params.get('cam');
  if (camParam) {
    const [x, y, z, tx, ty, tz] = camParam.split(',').map(Number);
    cam.position.set(x, y, z);
    cam.lookAt(tx, ty, tz);
  } else {
    cam.position.set(30, 14, 22);
    cam.lookAt(42, 5, 52);
  }
  const fly = new FlyControls(cam, eng.gr.renderer.domElement);
  eng.renderHooks.push((dt) => {
    fly.update(dt);
    eng.gr.updateSun(cam.position.clone().add(cam.getWorldDirection(new THREE.Vector3()).multiplyScalar(18)));
  });

  // ---- destruction playground: 1 smash, 2 slice, 3 bore, 4 getsuga, 5 burn, 6 restore
  let tool = 1;
  window.addEventListener('keydown', (e) => {
    if (e.code.startsWith('Digit')) tool = Number(e.code.slice(5)) || tool;
  });
  eng.gr.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  eng.gr.renderer.domElement.addEventListener('mousedown', (e) => {
    if (e.button !== 2) return;
    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    const hit = raycastVoxels(world, cam.position.x, cam.position.y, cam.position.z, dir.x, dir.y, dir.z, 300);
    if (!hit) return;
    const p = new THREE.Vector3((hit.x + 0.5) * world.vs, (hit.y + 0.5) * world.vs, (hit.z + 0.5) * world.vs);
    applyTool(eng, tool, p, dir);
  });

  document.getElementById('boot')?.remove();
  eng.start();

  (window as unknown as { __reishi: unknown }).__reishi = {
    ready: () => eng.pendingWork === 0 && eng.frames > 2,
    stats: () => ({
      genMs: Math.round(genMs),
      memMB: +(world.memoryBytes() / 1048576).toFixed(1),
      chunks: world.chunks.filter(Boolean).length,
      meshed: eng.wr.stats.chunksMeshed,
      fragments: eng.fragments.fragments.length,
      debris: eng.debris.count,
      colliders: eng.physics.stats.chunkColliders,
      integrity: eng.destruction.integrity.stats,
      workers: eng.pool.size,
    }),
    setCam: (x: number, y: number, z: number, tx: number, ty: number, tz: number) => {
      cam.position.set(x, y, z);
      cam.lookAt(tx, ty, tz);
    },
    advance: (n: number) => eng.advance(n),
    pause: () => eng.stop(),
    /** stop the sim clock but keep rendering (screenshots of exact sim states) */
    freeze: (on = true) => { eng.timeScale = on ? 0 : 1; },
    demo: (name: string) => runDemo(eng, name),
    engine: eng,
  };
}

function applyTool(eng: Engine, tool: number, p: THREE.Vector3, dir: THREE.Vector3): void {
  const d = eng.destruction;
  if (tool === 1) d.carve(new SphereShape(p, 2.2), { mode: 'smash', power: 60, impulse: 10 });
  else if (tool === 2) {
    const side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().setY(0).normalize());
    q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.5));
    d.carve(new BoxShape(p, new THREE.Vector3(14, 0.13, 6), q), { mode: 'cut', power: 400, dir: side, sparks: [0.6, 0.85, 3] });
  } else if (tool === 3) d.carve(new CapsuleShape(p.clone().addScaledVector(dir, -2), p.clone().addScaledVector(dir, 25), 1.2), { mode: 'bore', power: 300, sparks: [3, 1.2, 0.4] });
  else if (tool === 4) {
    const fwd = dir.clone().setY(0).normalize();
    const side = new THREE.Vector3(0, 1, 0);
    d.carve(new CrescentShape(p.clone(), fwd, side, 4.5, 1.1, 0.5, 0.35), { mode: 'cut', power: 500, dir: fwd, sparks: [0.6, 0.9, 3] });
  } else if (tool === 5) d.carve(new SphereShape(p, 3), { mode: 'burn', power: 30 });
  else if (tool === 6) {
    const vs = eng.world.vs;
    eng.editLog.restore(p.x / vs, p.y / vs, p.z / vs, 8 / vs);
  }
}

function runDemo(eng: Engine, name: string): void {
  const d = eng.destruction;
  if (name === 'slice') {
    // diagonal cut through the concrete block (x 60..70 m, z 56..68 m, y 4..18 m)
    const c = new THREE.Vector3(65, 12, 62);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.45));
    d.carve(new BoxShape(c, new THREE.Vector3(9, 0.13, 9), q), { mode: 'cut', power: 500, dir: new THREE.Vector3(-1, -0.4, 0).normalize(), sparks: [0.6, 0.85, 3] });
    d.carve(new SphereShape(new THREE.Vector3(36, 4, 44), 3), { mode: 'smash', power: 80, impulse: 12 });
    d.carve(new CrescentShape(new THREE.Vector3(22, 6.5, 52), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0), 4.5, 1.1, 0.5, 0.35), { mode: 'cut', power: 500, dir: new THREE.Vector3(0, 0, 1), sparks: [0.6, 0.9, 3] });
  }
}

/** Minimal dev fly camera: WASD/QE + left-drag look. */
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
    el.addEventListener('mousedown', (ev) => { if (ev.button === 0) this.dragging = true; });
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
