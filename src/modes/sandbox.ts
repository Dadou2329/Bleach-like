// Playable sandbox: Ichigo vs waves of Hollows in a destructible map. Exposes window.__reishi for
// scripted tests (ready, stats, act, tap, cam, spawn, freeze).
import * as THREE from 'three';
import { Engine } from '../engine';
import { QUALITY_HIGH, QUALITY_LOW } from '../render/renderer';
import { generateTestArena } from '../maps/testArena';
import { Game } from '../game/game';
import { Hud } from '../ui/hud';
import { ICHIGO_DEF, IchigoKit } from '../game/kits/ichigo';
import { PlayerController } from '../game/player';
import { HollowAI, hollowDef } from '../game/ai/hollow';
import type { VoxelWorld } from '../voxel/world';
import type { Fighter } from '../game/fighter';
import { TEX_GLOW } from '../vfx/sprites';
import { ichigoAsset, ichigoSword } from '../chars/ichigo';
import { buildCached } from '../game/characterFactory';

function groundAt(w: VoxelWorld, x: number, z: number): number {
  const vs = w.vs;
  const ix = Math.floor(x / vs), iz = Math.floor(z / vs);
  for (let y = w.sy - 1; y >= 0; y--) if (w.isSolid(ix, y, iz)) return (y + 1) * vs;
  return 0;
}

export async function bootSandbox(app: HTMLElement, params: URLSearchParams): Promise<void> {
  const quality = params.get('q') === 'low' ? QUALITY_LOW : QUALITY_HIGH;
  const world = generateTestArena(Number(params.get('seed') ?? 1));
  const eng = await Engine.create(app, world, quality);
  const game = new Game(eng);
  const hud = new Hud(game, app);
  const spawnXZ = new THREE.Vector2(30, 36);
  const p0 = new THREE.Vector3(spawnXZ.x, groundAt(world, spawnXZ.x, spawnXZ.y) + 0.05, spawnXZ.y);
  const def = { ...ICHIGO_DEF, speed: { ...ICHIGO_DEF.speed } };
  const ichigo = game.spawn(def, p0, 0);
  ichigo.yaw = Math.PI * 0.25;
  const kit = new IchigoKit(ichigo, game);
  hud.abilityProvider = () => kit.abilities();
  game.controllers.push(new PlayerController(game, ichigo, kit));
  game.cam.yaw = ichigo.yaw + Math.PI;

  // ---- Hollow waves
  let seed = 11;
  let wave = 0;
  const maxAlive = Number(params.get('hollows') ?? 4);
  const spawnHollow = (near?: THREE.Vector3): Fighter => {
    const a = Math.random() * Math.PI * 2;
    const c = near ?? ichigo.pos;
    const r = 14 + Math.random() * 10;
    let x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
    const W = world.sx * world.vs, D = world.sz * world.vs;
    x = Math.min(W - 6, Math.max(6, x));
    z = Math.min(D - 6, Math.max(6, z));
    const size = 0.9 + Math.random() * 0.35;
    const h = game.spawn(hollowDef(seed++, size), new THREE.Vector3(x, groundAt(world, x, z) + 0.1, z), 1);
    game.controllers.push(new HollowAI(game, h));
    // arrival: a black-red tear in the air
    const glow = eng.glow;
    for (let i = 0; i < 24; i++)
      glow.spawn({ x, y: h.pos.y + 1.2 + (Math.random() - 0.5) * 2.4, z, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 2, vz: (Math.random() - 0.5) * 3, size: 0.4, sizeEnd: 0.05, life: 0.6, r: 0.7, g: 0.05, b: 0.1, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
    return h;
  };
  let waveT = 2.5;
  eng.systems.push({
    update: (dt) => {
      if (params.get('hollows') === '0') return;
      const alive = game.fighters.filter((f) => f.team === 1 && !f.dead).length;
      if (alive === 0) waveT -= dt;
      if (alive === 0 && waveT <= 0) {
        wave++;
        waveT = 3;
        const n = Math.min(maxAlive + wave, 8);
        for (let i = 0; i < n; i++) spawnHollow();
        hud.showBanner(`WAVE ${wave}<br><small style="font-size:14px;letter-spacing:6px">HOLLOWS APPROACH</small>`, 2.2);
      }
      // the player recovers between waves
      if (alive === 0) ichigo.hp = Math.min(ichigo.maxHp, ichigo.hp + dt * 60);
    },
  });

  document.getElementById('boot')?.remove();
  eng.start();
  // warm the Bankai form in idle time so the release does not hitch
  const idle = (cb: () => void) => ((window as unknown as { requestIdleCallback?: (f: () => void) => void }).requestIdleCallback ?? ((f: () => void) => setTimeout(f, 1500)))(cb);
  idle(() => {
    const a = ichigoAsset('bankai');
    buildCached(a.model, true);
    buildCached(ichigoSword('bankai'), false);
  });
  hud.showBanner('KARAKURA — TRAINING GROUNDS<br><small style="font-size:14px;letter-spacing:4px">click to capture the mouse · H for controls</small>', 4);

  const api = {
    ready: () => eng.pendingWork === 0 && eng.frames > 2,
    stats: () => ({
      fighters: game.fighters.length,
      hp: Math.round(ichigo.hp),
      rei: Math.round(ichigo.rei),
      pos: ichigo.pos.toArray().map((v) => +v.toFixed(2)),
      action: ichigo.action?.name ?? null,
      projectiles: game.projectiles.length,
      removed: eng.destruction.stats.removed,
      debris: eng.debris.count,
      fragments: eng.fragments.fragments.length,
      frames: eng.frames,
    }),
    /** run a kit action directly: attack, heavy, getsuga, release, flare, dash, jump */
    act: (name: string) => {
      if (name === 'attack') kit.attack();
      else if (name === 'heavy') kit.heavy();
      else if (name === 'getsuga') kit.getsuga();
      else if (name === 'release') kit.release();
      else if (name === 'flare') kit.toggleFlare();
      else if (name === 'dash') ichigo.dash(ichigo.forward());
      else if (name === 'jump') ichigo.body.vel.y = ichigo.def.speed.jump;
    },
    tap: (code: string, ms = 60) => game.input.tap(code, ms),
    cam: (yaw: number, pitch = 0.18, dist = 4.6) => {
      game.cam.yaw = yaw;
      game.cam.pitch = pitch;
      game.cam.dist = dist;
    },
    face: (yaw: number) => { ichigo.yaw = yaw; },
    freeCam: (x: number, y: number, z: number, tx: number, ty: number, tz: number) => {
      game.cam.override = { pos: new THREE.Vector3(x, y, z), target: new THREE.Vector3(tx, ty, tz) };
    },
    followCam: () => { game.cam.override = null; },
    tp: (x: number, z: number, yaw = ichigo.yaw) => {
      ichigo.body.pos.set(x, groundAt(world, x, z) + 0.05, z);
      ichigo.body.prev.copy(ichigo.body.pos);
      ichigo.yaw = yaw;
      game.cam.yaw = yaw + Math.PI;
    },
    spawn: (n = 1, dist = 8) => {
      for (let i = 0; i < n; i++) {
        const fw = ichigo.forward();
        const p = ichigo.pos.clone().addScaledVector(fw, dist + i * 2.5);
        p.x += (i % 2 ? 1 : -1) * i * 1.2;
        const h = game.spawn(hollowDef(seed++, 1), new THREE.Vector3(p.x, groundAt(world, p.x, p.z) + 0.1, p.z), 1);
        h.yaw = ichigo.yaw + Math.PI;
        game.controllers.push(new HollowAI(game, h));
      }
    },
    advance: (n: number) => eng.advance(n),
    /** deterministic: n × (sim step + render) */
    play: (n: number) => {
      for (let i = 0; i < n; i++) {
        eng.step();
        eng.renderFrame(1 / 60, 1);
      }
    },
    freeze: (on = true) => { eng.timeScale = on ? 0 : 1; },
    game,
    engine: eng,
    player: ichigo,
    kit,
  };
  (window as unknown as { __reishi: unknown }).__reishi = api;
}
