// Engine core: owns the world, renderer and the simulation systems. Modes (sandbox, versus, story)
// build on top of it. Simulation runs at a fixed 60 Hz; rendering interpolates.
import * as THREE from 'three';
import { GameRenderer, QUALITY_HIGH, type Quality } from './render/renderer';
import { buildPaletteTextures } from './render/palette';
import { createVoxelMaterial } from './render/voxelMaterial';
import { WorldRenderer } from './render/worldRenderer';
import { MeshPool } from './voxel/meshPool';
import type { VoxelWorld } from './voxel/world';
import { Physics, initRapier } from './physics/physics';
import { DebrisSystem } from './vfx/debris';
import { SpriteSystem } from './vfx/sprites';
import { FragmentSystem } from './destruction/fragments';
import { DestructionSystem } from './destruction/destruction';
import { EditLog } from './destruction/editLog';

export const SIM_DT = 1 / 60;

export interface SimSystem {
  update(dt: number): void;
}

export class Engine {
  readonly gr: GameRenderer;
  readonly world: VoxelWorld;
  readonly wr: WorldRenderer;
  readonly pool: MeshPool;
  readonly physics: Physics;
  readonly debris: DebrisSystem;
  readonly dust: SpriteSystem;
  readonly glow: SpriteSystem;
  readonly fragments: FragmentSystem;
  readonly destruction: DestructionSystem;
  readonly editLog: EditLog;
  readonly voxelMat: THREE.Material;
  readonly voxelObjMat: THREE.Material;
  readonly voxelObjTransMat: THREE.Material;
  /** extra per-step systems (characters, AI, abilities…) */
  readonly systems: SimSystem[] = [];
  /** per-render-frame callbacks (camera, animation interpolation, HUD) */
  readonly renderHooks: ((dt: number, alpha: number) => void)[] = [];
  /** global time scale (slow-mo) */
  timeScale = 1;
  /** the sim clock stopped (pause menu, scripted captures); slow motion cannot undo it */
  paused = false;
  /** remaining hitstop seconds (freezes the sim, keeps rendering) */
  hitstop = 0;
  simTime = 0;
  private acc = 0;
  private last = 0;
  frames = 0;
  running = false;

  private constructor(container: HTMLElement, world: VoxelWorld, quality: Quality) {
    this.world = world;
    this.gr = new GameRenderer(container, quality);
    const { colors, params } = buildPaletteTextures(world.mats);
    this.voxelMat = createVoxelMaterial({ colors, params, voxelSize: world.vs });
    const transMat = createVoxelMaterial({ colors, params, voxelSize: world.vs, transparent: true });
    this.voxelObjMat = createVoxelMaterial({ colors, params, voxelSize: world.vs, objectMode: true });
    this.voxelObjTransMat = createVoxelMaterial({ colors, params, voxelSize: world.vs, objectMode: true, transparent: true });
    this.pool = new MeshPool(world.mats.flags);
    this.wr = new WorldRenderer(world, this.pool, this.voxelMat, transMat);
    this.wr.markAllDirty();
    this.gr.scene.add(this.wr.group);

    this.physics = new Physics(world);
    this.debris = new DebrisSystem(world, world.mats, 16000);
    this.dust = new SpriteSystem(3000, false);
    this.glow = new SpriteSystem(6000, true);
    this.gr.scene.add(this.debris.mesh, this.dust.mesh, this.glow.mesh);
    this.fragments = new FragmentSystem(world, this.physics, this.voxelObjMat, this.voxelObjTransMat, this.debris, this.dust);
    this.gr.scene.add(this.fragments.group);
    this.destruction = new DestructionSystem(world, this.debris, this.dust, this.glow, this.fragments);
    this.editLog = new EditLog(world);
    world.onEdit = (x, y, z, o, n) => {
      this.physics.onVoxelEdit(x, y, z, o, n);
      this.editLog.record(x, y, z, o, n);
    };
    const fog = this.gr.scene.fog as THREE.Fog;
    this.dust.setFog(fog.color, fog.near, fog.far);
  }

  static async create(container: HTMLElement, world: VoxelWorld, quality: Quality = QUALITY_HIGH): Promise<Engine> {
    await initRapier();
    return new Engine(container, world, quality);
  }

  /** One fixed simulation step. */
  step(dt = SIM_DT): void {
    this.simTime += dt;
    this.world.time = this.simTime;
    for (const s of this.systems) s.update(dt);
    this.destruction.update();
    this.physics.step(dt);
    this.fragments.update(dt);
    this.debris.update(dt);
    this.dust.update(dt);
    this.glow.update(dt);
    if (this.frames % 30 === 0) this.world.compressIdle(8, 4);
  }

  /** Advance n fixed steps immediately (tests / screenshot scripts). */
  advance(n: number): void {
    for (let i = 0; i < n; i++) this.step();
  }

  renderFrame(dt: number, alpha = 1): void {
    const cam = this.gr.camera;
    this.wr.update(cam.position, 32, 48);
    for (const h of this.renderHooks) h(dt, alpha);
    this.gr.render(dt);
    this.frames++;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = () => {
      if (!this.running) return;
      const now = performance.now();
      const realDt = Math.min(0.1, (now - this.last) / 1000);
      this.last = now;
      if (this.paused) this.acc = 0;
      else if (this.hitstop > 0) this.hitstop = Math.max(0, this.hitstop - realDt);
      else {
        this.acc += realDt * this.timeScale;
        let steps = 0;
        while (this.acc >= SIM_DT && steps < 4) {
          this.step(SIM_DT);
          this.acc -= SIM_DT;
          steps++;
        }
        if (steps === 4) this.acc = 0;
      }
      this.renderFrame(realDt, this.acc / SIM_DT);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
  }

  get pendingWork(): number {
    return this.wr.pending + this.fragments.pending;
  }
}
