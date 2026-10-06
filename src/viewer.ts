// Model / animation review mode: ?mode=model&char=ichigo[&form=bankai][&view=front|three|side|back|face]
// Exposes window.__reishi.view(name), .yaw(deg), .pose(name), .play(clip) for scripted screenshots.
import * as THREE from 'three';
import { Engine } from './engine';
import { generateStage } from './maps/stage';
import { QUALITY_HIGH, QUALITY_LOW } from './render/renderer';
import { CharacterVisual } from './game/characterFactory';
import { buildIchigo, buildZangetsuShikai, type IchigoForm } from './chars/ichigo';
import { Pose } from './anim/pose';

const VIEWS: Record<string, [number, number, number, number, number, number]> = {
  // camera offset (x,y,z) and target (x,y,z) relative to the model origin
  front: [0, 1.05, 2.25, 0, 0.92, 0],
  three: [1.45, 1.2, 1.75, 0, 0.92, 0],
  side: [2.3, 1.05, 0, 0, 0.92, 0],
  back: [-0.9, 1.25, -2.1, 0, 0.95, 0],
  face: [0.22, 1.66, 0.62, 0, 1.6, 0],
  facefront: [0, 1.62, 0.6, 0, 1.62, 0],
  bust: [0.55, 1.5, 1.1, 0, 1.38, 0],
  feet: [0.6, 0.4, 1.1, 0, 0.2, 0],
  wide: [3.5, 2.2, 6.5, 0, 0.9, 0],
};

export async function bootViewer(app: HTMLElement, params: URLSearchParams): Promise<void> {
  const quality = params.get('q') === 'low' ? QUALITY_LOW : QUALITY_HIGH;
  const world = generateStage();
  const eng = await Engine.create(app, world, quality);
  const form = (params.get('form') ?? 'shikai') as IchigoForm;
  const t0 = performance.now();
  const asset = buildIchigo(form);
  const tModel = performance.now() - t0;
  const ch = new CharacterVisual(asset.model, asset.springs, asset.colliders);
  const sword = buildZangetsuShikai();
  ch.attach('sword', sword, 'grip.R');
  const origin = new THREE.Vector3(16, 2, 16);
  ch.object.position.copy(origin);
  eng.gr.scene.add(ch.object);
  const pose = new Pose(ch.rig.count);
  const cam = eng.gr.camera;
  let yaw = 0;
  let view = params.get('view') ?? 'three';
  const setView = (name: string) => {
    view = name;
    const v = VIEWS[name] ?? VIEWS.three;
    cam.position.set(origin.x + v[0], origin.y + v[1], origin.z + v[2]);
    cam.lookAt(origin.x + v[3], origin.y + v[4], origin.z + v[5]);
  };
  setView(view);
  const poses: Record<string, (p: Pose) => void> = {
    rest: (p) => p.identity(),
    idle: (p) => {
      p.identity();
      const r = ch.rig;
      p.setEuler(r.index('upperarm.L'), 4, 0, 9);
      p.setEuler(r.index('upperarm.R'), -12, 0, -10);
      p.setEuler(r.index('forearm.L'), -12, 0, 0);
      p.setEuler(r.index('forearm.R'), -35, 0, 0);
      p.setEuler(r.index('hand.R'), 20, 0, 0);
      p.setEuler(r.index('thigh.L'), -4, 0, 3);
      p.setEuler(r.index('thigh.R'), 5, 0, -3);
      p.setEuler(r.index('shin.R'), 8, 0, 0);
      p.setEuler(r.index('head'), 4, -6, 0);
    },
    tpose: (p) => {
      p.identity();
      p.setEuler(ch.rig.index('upperarm.L'), 0, 0, 90);
      p.setEuler(ch.rig.index('upperarm.R'), 0, 0, -90);
    },
    swing: (p) => {
      p.identity();
      const r = ch.rig;
      p.setEuler(r.index('upperarm.R'), -150, 0, -20);
      p.setEuler(r.index('forearm.R'), -30, 0, 0);
      p.setEuler(r.index('upperarm.L'), -120, 0, 25);
      p.setEuler(r.index('forearm.L'), -40, 0, 0);
      p.setEuler(r.index('chest'), -8, 15, 0);
      p.setEuler(r.index('thigh.L'), -35, 0, 5);
      p.setEuler(r.index('shin.L'), 40, 0, 0);
      p.setEuler(r.index('thigh.R'), 20, 0, -5);
      p.setEuler(r.index('shin.R'), 25, 0, 0);
      p.hips.set(0, -0.08, 0);
    },
  };
  let poseName = params.get('pose') ?? 'idle';
  const applyPose = () => {
    (poses[poseName] ?? poses.idle)(pose);
    ch.rig.applyPose(pose);
    ch.object.rotation.y = (yaw * Math.PI) / 180;
    ch.object.updateMatrixWorld(true);
  };
  applyPose();
  eng.renderHooks.push((dt) => {
    applyPose();
    ch.springs.update(dt);
    eng.gr.updateSun(origin.clone().add(new THREE.Vector3(0, 1, 0)));
  });
  document.getElementById('boot')?.remove();
  eng.start();
  (window as unknown as { __reishi: unknown }).__reishi = {
    ready: () => eng.pendingWork === 0 && eng.frames > 2,
    stats: () => ({ modelMs: Math.round(tModel), meshMs: Math.round(ch.stats.buildMs), voxels: ch.stats.voxels, tris: ch.stats.triangles, warnings: asset.warnings }),
    view: setView,
    yaw: (d: number) => { yaw = d; },
    pose: (n: string) => { poseName = n; },
    engine: eng,
    character: ch,
    get currentView() { return view; },
  };
}
