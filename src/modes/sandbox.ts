// Playable sandbox: any roster character in a destructible map, against Hollow waves (with a Menos
// Grande every third wave) or in a duel against another roster character piloted by the duel AI.
// URL: ?char=<id> picks the fighter, ?vs=<id> starts a duel, ?map=arena, ?hollows=0, ?autostart.
// Exposes window.__reishi for scripted tests (ready, stats, act, tap, cam, spawn, duel, freeze…).
import * as THREE from 'three';
import { Engine } from '../engine';
import { QUALITY_HIGH, QUALITY_LOW } from '../render/renderer';
import { generateTestArena } from '../maps/testArena';
import { generateKarakura } from '../maps/karakura';
import { Game } from '../game/game';
import { Hud } from '../ui/hud';
import { PlayerController } from '../game/player';
import { HollowAI, hollowDef } from '../game/ai/hollow';
import { MenosAI, menosDef } from '../game/ai/menos';
import { DuelistAI } from '../game/ai/duelist';
import { ROSTER, rosterEntry, type RosterEntry } from '../game/roster';
import type { Kit } from '../game/kits/kit';
import type { VoxelWorld } from '../voxel/world';
import type { Fighter } from '../game/fighter';
import { TEX_GLOW } from '../vfx/sprites';
import { pauseOverlay, showStart, type StartChoice } from '../ui/start';

function groundAt(w: VoxelWorld, x: number, z: number): number {
  const vs = w.vs;
  const ix = Math.floor(x / vs), iz = Math.floor(z / vs);
  for (let y = w.sy - 1; y >= 0; y--) if (w.isSolid(ix, y, iz)) return (y + 1) * vs;
  return 0;
}

const idle = (cb: () => void) => ((window as unknown as { requestIdleCallback?: (f: () => void) => void }).requestIdleCallback ?? ((f: () => void) => setTimeout(f, 1500)))(cb);

export async function bootSandbox(app: HTMLElement, params: URLSearchParams): Promise<void> {
  const quality = params.get('q') === 'low' ? QUALITY_LOW : QUALITY_HIGH;
  const arena = params.get('map') === 'arena';
  const town = arena ? null : generateKarakura(Number(params.get('seed') ?? 7));
  const world = town ? town.world : generateTestArena(Number(params.get('seed') ?? 1));
  const eng = await Engine.create(app, world, quality);
  const game = new Game(eng);
  const hud = new Hud(game, app);
  const spawnXZ = town ? new THREE.Vector2(...town.spawn) : new THREE.Vector2(30, 36);
  const p0 = new THREE.Vector3(spawnXZ.x, groundAt(world, spawnXZ.x, spawnXZ.y) + 0.05, spawnXZ.y);
  const W = world.sx * world.vs, D = world.sz * world.vs;

  // ---- player
  let playerEntry = rosterEntry(params.get('char'));
  let player!: Fighter;
  let kit!: Kit;
  const setPlayer = (entry: RosterEntry, at?: THREE.Vector3, yaw = Math.PI * 0.25) => {
    if (player) game.remove(player);
    playerEntry = entry;
    player = game.spawn(entry.def(), (at ?? p0).clone(), 0);
    player.yaw = yaw;
    kit = entry.kit(player, game);
    hud.abilityProvider = () => kit.abilities();
    hud.formProvider = () => kit.formName();
    game.controllers.push(new PlayerController(game, player, kit));
    game.cam.yaw = yaw + Math.PI;
    idle(() => entry.warm?.());
  };
  setPlayer(playerEntry);

  // ---- duel rival
  let mode: 'waves' | 'duel' = params.get('vs') ? 'duel' : 'waves';
  let rivalEntry = rosterEntry(params.get('vs') ?? (playerEntry.id === 'ichigo' ? ROSTER[ROSTER.length - 1].id : 'ichigo'));
  let rival: Fighter | null = null;
  let rivalKit: Kit | null = null;
  const startDuel = (entry: RosterEntry, dist = 16) => {
    if (rival) game.remove(rival);
    rivalEntry = entry;
    const fw = player.forward();
    const x = Math.min(W - 8, Math.max(8, player.pos.x + fw.x * dist));
    const z = Math.min(D - 8, Math.max(8, player.pos.z + fw.z * dist));
    rival = game.spawn(entry.def(), new THREE.Vector3(x, groundAt(world, x, z) + 0.05, z), 1);
    rival.yaw = player.yaw + Math.PI;
    rivalKit = entry.kit(rival, game);
    game.controllers.push(new DuelistAI(game, rival, rivalKit, { aggression: Number(params.get('ai') ?? 0.7) }));
    hud.rival = rival;
    mode = 'duel';
    idle(() => entry.warm?.());
    return rival;
  };

  // ---- Hollow waves
  let seed = 11;
  let wave = 0;
  const maxAlive = Number(params.get('hollows') ?? 4);
  const spawnHollow = (near?: THREE.Vector3): Fighter => {
    const a = Math.random() * Math.PI * 2;
    const c = near ?? player.pos;
    const r = 14 + Math.random() * 10;
    let x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
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
  const groundY = town ? town.ground : 4;
  const spawnMenos = (dist = 70): Fighter => {
    let best = new THREE.Vector3(W / 2, groundY, W / 2);
    for (let k = 0; k < 12; k++) {
      const a = Math.random() * Math.PI * 2;
      const p = new THREE.Vector3(player.pos.x + Math.cos(a) * dist, groundY, player.pos.z + Math.sin(a) * dist);
      if (p.x > 20 && p.x < W - 20 && p.z > 20 && p.z < W - 20) { best = p; break; }
    }
    const m = game.spawn(menosDef(seed++), best, 1);
    game.controllers.push(new MenosAI(game, m, groundY));
    return m;
  };
  let waveT = 2.5;
  let started = params.has('hollows') || params.has('autostart') || params.has('vs');
  let playerDeadT = 0;
  let rivalDeadT = 0;
  let round = 1;
  eng.systems.push({
    update: (dt) => {
      if (!started) return;
      // knocked out: get back up where you fell
      if (player.dead) {
        playerDeadT += dt;
        if (playerDeadT > 3.5) {
          playerDeadT = 0;
          const at = player.pos.clone();
          at.y = groundAt(world, at.x, at.z) + 0.05;
          setPlayer(playerEntry, at, player.yaw);
          hud.showBanner('GET UP', 1.6);
        }
      }
      if (mode === 'duel') {
        if (rival && rival.dead) {
          rivalDeadT += dt;
          if (rivalDeadT > 5.5) {
            rivalDeadT = 0;
            round++;
            const r = startDuel(rivalEntry);
            hud.showBanner(`${r.name.toUpperCase()}<br><small style="font-size:14px;letter-spacing:6px">ROUND ${round}</small>`, 2.2);
          }
        }
        if (params.get('hollows') === null) return;
      }
      if (params.get('hollows') === '0') return;
      const alive = game.fighters.filter((f) => f.team === 1 && !f.dead && f !== rival).length;
      if (alive === 0) waveT -= dt;
      if (alive === 0 && waveT <= 0) {
        wave++;
        waveT = 3;
        const n = Math.min(maxAlive + wave, 8);
        for (let i = 0; i < n; i++) spawnHollow();
        if (wave % 3 === 0) spawnMenos();
        hud.showBanner(`WAVE ${wave}<br><small style="font-size:14px;letter-spacing:6px">HOLLOWS APPROACH</small>`, 2.2);
      }
      // the player recovers between waves
      if (alive === 0 && !player.dead) player.hp = Math.min(player.maxHp, player.hp + dt * 60);
    },
  });
  if (mode === 'duel') startDuel(rivalEntry);

  document.getElementById('boot')?.remove();
  eng.start();
  // attract camera until PLAY, then pause whenever the pointer lock is released
  const canvas = eng.gr.renderer.domElement;
  let attractT = 0;
  if (!started) {
    game.input.enabled = false;
    const center = player.pos.clone();
    game.cam.override = { pos: new THREE.Vector3(), target: center.clone().setY(center.y + 4) };
    eng.renderHooks.push((dt) => {
      if (started) return;
      attractT += dt;
      const a = attractT * 0.06;
      game.cam.override?.pos.set(center.x + Math.cos(a) * 38, center.y + 22, center.z + Math.sin(a) * 38);
    });
    hud.root.style.display = 'none';
    const pause = pauseOverlay(app, () => canvas.requestPointerLock?.());
    const init: StartChoice = { char: playerEntry.id, mode, vs: rivalEntry.id };
    showStart(app, ROSTER, init, (c) => {
      started = true;
      game.cam.override = null;
      game.input.enabled = true;
      hud.root.style.display = '';
      game.sfx.unlock();
      canvas.requestPointerLock?.();
      if (c.char !== playerEntry.id) setPlayer(rosterEntry(c.char), player.pos.clone(), player.yaw);
      if (c.mode === 'duel') {
        const r = startDuel(rosterEntry(c.vs));
        hud.showBanner(`${player.name.toUpperCase()} <small>vs</small> ${r.name.toUpperCase()}<br><small style="font-size:14px;letter-spacing:6px">${town ? 'KARAKURA TOWN' : 'TRAINING GROUNDS'}</small>`, 3);
      } else {
        mode = 'waves';
        hud.showBanner(`${town ? 'KARAKURA TOWN' : 'TRAINING GROUNDS'}<br><small style="font-size:14px;letter-spacing:4px">Hollows incoming</small>`, 3);
      }
      document.addEventListener('pointerlockchange', () => {
        const locked = document.pointerLockElement === canvas;
        pause.show(!locked);
        eng.timeScale = locked ? 1 : 0;
      });
    }, quality === QUALITY_LOW ? 'low' : 'high');
  }

  const api = {
    ready: () => eng.pendingWork === 0 && eng.frames > 2,
    stats: () => ({
      fighters: game.fighters.length,
      hp: Math.round(player.hp),
      rei: Math.round(player.rei),
      pos: player.pos.toArray().map((v) => +v.toFixed(2)),
      action: player.action?.name ?? null,
      rival: rival ? { name: rival.name, hp: Math.round(rival.hp), action: rival.action?.name ?? null, pos: rival.pos.toArray().map((v) => +v.toFixed(2)) } : null,
      projectiles: game.projectiles.length,
      removed: eng.destruction.stats.removed,
      debris: eng.debris.count,
      fragments: eng.fragments.fragments.length,
      frames: eng.frames,
    }),
    /** run a kit slot directly: attack, heavy, skill1..3 (getsuga = skill1), release, toggle (mask), flare, dash, jump */
    act: (name: string) => {
      const k = kit;
      if (name === 'attack') k.attack();
      else if (name === 'heavy') k.heavy();
      else if (name === 'skill1' || name === 'getsuga') k.skill1();
      else if (name === 'skill2') k.skill2?.();
      else if (name === 'skill3') k.skill3?.();
      else if (name === 'release') k.release();
      else if (name === 'toggle' || name === 'mask') k.toggle?.();
      else if (name === 'flare') k.toggleFlare();
      else if (name === 'dash') player.dash(player.forward());
      else if (name === 'jump') player.body.vel.y = player.def.speed.jump;
    },
    /** same for the duel rival */
    rivalAct: (name: string) => {
      const k = rivalKit;
      if (!k) return;
      if (name === 'attack') k.attack();
      else if (name === 'heavy') k.heavy();
      else if (name === 'skill1') k.skill1();
      else if (name === 'skill2') k.skill2?.();
      else if (name === 'skill3') k.skill3?.();
      else if (name === 'release') k.release();
      else if (name === 'toggle') k.toggle?.();
    },
    tap: (code: string, ms = 60) => game.input.tap(code, ms),
    cam: (yaw: number, pitch = 0.18, dist = 4.6) => {
      game.cam.yaw = yaw;
      game.cam.pitch = pitch;
      game.cam.dist = dist;
    },
    face: (yaw: number) => { player.yaw = yaw; },
    freeCam: (x: number, y: number, z: number, tx: number, ty: number, tz: number) => {
      game.cam.override = { pos: new THREE.Vector3(x, y, z), target: new THREE.Vector3(tx, ty, tz) };
    },
    followCam: () => { game.cam.override = null; },
    tp: (x: number, z: number, yaw = player.yaw) => {
      player.body.pos.set(x, groundAt(world, x, z) + 0.05, z);
      player.body.prev.copy(player.body.pos);
      player.yaw = yaw;
      game.cam.yaw = yaw + Math.PI;
    },
    spawn: (n = 1, dist = 8) => {
      for (let i = 0; i < n; i++) {
        const fw = player.forward();
        const p = player.pos.clone().addScaledVector(fw, dist + i * 2.5);
        p.x += (i % 2 ? 1 : -1) * i * 1.2;
        const h = game.spawn(hollowDef(seed++, 1), new THREE.Vector3(p.x, groundAt(world, p.x, p.z) + 0.1, p.z), 1);
        h.yaw = player.yaw + Math.PI;
        game.controllers.push(new HollowAI(game, h));
      }
    },
    /** start a duel against a roster character (AI) */
    duel: (id: string, dist = 16) => startDuel(rosterEntry(id), dist),
    /** play as another roster character */
    setChar: (id: string) => setPlayer(rosterEntry(id), player.pos.clone(), player.yaw),
    menos: (dist = 60) => spawnMenos(dist),
    advance: (n: number) => eng.advance(n),
    /** deterministic: n × (sim step + render) */
    play: (n: number) => {
      for (let i = 0; i < n; i++) {
        eng.step();
        eng.renderFrame(1 / 60, 1);
      }
    },
    freeze: (on = true) => { eng.timeScale = on ? 0 : 1; },
    spots: town?.spots ?? {},
    game,
    engine: eng,
    get player() { return player; },
    get kit() { return kit; },
    get rival() { return rival; },
    get rivalKit() { return rivalKit; },
  };
  (window as unknown as { __reishi: unknown }).__reishi = api;
}
