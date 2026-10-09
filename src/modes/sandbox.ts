// The game: any roster character in a destructible map, in one of three modes —
//   Vs AI: a duel against another roster character piloted by the duel AI (rounds);
//   Sandbox: walk the city with no limits (full reiatsu, no cooldowns, lockouts or form timers, no death), N calls a
//     training opponent, Backspace rebuilds the town; optionally Hollow waves with a Menos every third wave;
//   Vs Player 2: two players who have the game, joined by a lobby code (src/net/net.ts).
// URL: ?char=<id> picks the fighter, ?vs=<id> starts a duel, ?sandbox, ?map=arena, ?hollows=N (0 = none), ?autostart,
// ?watch (the player's fighter is AI-driven too: spectator QA), ?join=CODE (open straight into a lobby),
// ?net=local (Vs Player 2 between two tabs of one browser).
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
import { SphereShape } from '../destruction/shapes';
import type { CarveMode } from '../destruction/destruction';
import { pauseOverlay, showStart, type StartChoice, type StartNet, type StartScreen } from '../ui/start';
import { unleash } from '../game/sandboxRules';
import { lockPointer } from '../game/input';
import { cleanCode, hostLobby, joinLobby, makeCode, NET_VERSION, NetSession, type Transport } from '../net/net';
import { TownBackdrop } from '../render/backdrop';

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
  if (town) {
    // the town carried on past the map's edge, into the haze
    const backdrop = new TownBackdrop({ size: town.size, ground: town.ground, river: town.river });
    eng.gr.scene.add(backdrop.group);
    const fog = eng.gr.scene.fog as THREE.Fog;
    eng.renderHooks.push(() => backdrop.update(fog.color));
  }
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
    if (params.has('watch')) {
      // spectator QA: the player's fighter fights on its own
      game.player = player;
      game.controllers.push(new DuelistAI(game, player, kit, { aggression: 0.7, intro: 0.5 }));
    } else game.controllers.push(new PlayerController(game, player, kit));
    game.cam.yaw = yaw + Math.PI;
    idle(() => entry.warm?.());
  };
  setPlayer(playerEntry);

  // ---- mode
  let mode: StartChoice['mode'] = params.get('vs') ? 'duel' : 'sandbox';
  /** Sandbox rules (no limits) */
  let unlimited = params.has('sandbox');
  /** Hollow waves on (Sandbox) */
  let hollowsOn = params.get('hollows') !== null && params.get('hollows') !== '0';
  // ---- duel rival
  let rivalEntry = rosterEntry(params.get('vs') ?? (playerEntry.id === 'ichigo' || playerEntry.group === 'ichigo' ? ROSTER[ROSTER.length - 1].id : 'ichigo'));
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
      if (mode === 'online') return;
      if (unlimited && player) unleash(player, kit, dt);
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
        if (!hollowsOn) return;
      }
      if (!hollowsOn) return;
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

  // ---- Sandbox hotkeys: N calls a training opponent, Backspace rebuilds the town
  const rebuild = () => {
    const vs = world.vs;
    const c = new THREE.Vector3(W / 2, 0, D / 2);
    eng.editLog.restore(c.x / vs, c.y / vs, c.z / vs, 1e6, -Infinity, 4_000_000);
    eng.fragments.dissolveNear(c, 1e4);
    hud.showBanner('THE TOWN IS WHOLE AGAIN', 2);
  };
  window.addEventListener('keydown', (e) => {
    if (!started || mode !== 'sandbox' || !game.input.enabled) return;
    if (e.code === 'KeyN') {
      const pool = ROSTER.filter((r) => r.id !== playerEntry.id && r.group !== playerEntry.group);
      const r = startDuel(pool[Math.floor(Math.random() * pool.length)], 14);
      hud.showBanner(`${r.name.toUpperCase()}<br><small style="font-size:14px;letter-spacing:4px">training opponent</small>`, 2);
    }
    if (e.code === 'Backspace') {
      e.preventDefault();
      rebuild();
    }
  });

  // ---- Vs Player 2
  const localNet = params.get('net') === 'local';
  const mapName = town ? 'town' : 'arena';
  const placeName = town ? 'KARAKURA TOWN' : 'TRAINING GROUNDS';
  let net: Transport | null = null;
  let session: NetSession | null = null;
  let netRole: 'host' | 'guest' | null = null;
  let netCode = '';
  let peerChar: string | null = null;
  let remote: { f: Fighter; kit: Kit } | null = null;
  let netRound = 1;
  let netDeadT = 0;
  let startUi: StartScreen | null = null;
  const hello = () => net?.send({ t: 'hello', char: startUi?.choice.char ?? playerEntry.id, map: mapName, v: NET_VERSION });
  const lobbyListen = (status: (text: string, ready: boolean) => void) => (m: Parameters<NonNullable<Transport['onMessage']>>[0]) => {
    if (m.t === 'hello') {
      if (m.v !== NET_VERSION) {
        status('Player 2 has another version of the game', false);
        return;
      }
      if (netRole === 'guest' && m.map !== mapName) {
        // the host's map rules: come back on it and dial again
        const u = new URL(location.href);
        if (m.map === 'arena') u.searchParams.set('map', 'arena');
        else u.searchParams.delete('map');
        u.searchParams.set('join', netCode);
        location.href = u.toString();
        return;
      }
      peerChar = rosterEntry(m.char).id;
      const who = rosterEntry(m.char).name;
      status(netRole === 'host' ? `Player 2 is in — ${who}. Press START.` : `In the lobby — the host plays ${who}. The host starts the fight.`, netRole === 'host');
    } else if (m.t === 'start' && netRole === 'guest') {
      startUi?.close();
      beginOnline(rosterEntry(m.host).id, rosterEntry(m.guest).id);
    }
  };
  const netUi: StartNet = {
    host: (status) => {
      const code = makeCode();
      netRole = 'host';
      netCode = code;
      status(`Lobby open — give player 2 the code ${code}`, false);
      hostLobby(code, localNet, (t) => {
        net = t;
        t.onMessage = lobbyListen(status);
        t.onClose = () => status('Player 2 left the lobby', false);
        hello();
        status('Player 2 is joining…', false);
      }, (e) => status(`Lobby error: ${e}`, false));
      return code;
    },
    join: (code, status) => {
      netRole = 'guest';
      netCode = cleanCode(code);
      status(`Calling lobby ${netCode}…`, false);
      joinLobby(netCode, localNet, (t) => {
        net = t;
        t.onMessage = lobbyListen(status);
        t.onClose = () => status('The host closed the lobby', false);
        hello();
        status('Connected — waiting for the host', false);
      }, (e) => status(`Could not join: ${e}`, false));
    },
    pick: () => hello(),
    autoJoin: params.get('join') ? cleanCode(params.get('join')!) : undefined,
  };
  /** both fighters at their marks: the host's at the spawn, the guest's 16 m ahead (the same on both machines) */
  const spawnPair = (hostId: string, guestId: string) => {
    for (const f of [...game.fighters]) game.remove(f);
    rival = null;
    rivalKit = null;
    const yaw = Math.PI * 0.25;
    const bx = Math.min(W - 8, Math.max(8, p0.x + Math.sin(yaw) * 16)), bz = Math.min(D - 8, Math.max(8, p0.z + Math.cos(yaw) * 16));
    const hostE = rosterEntry(hostId), guestE = rosterEntry(guestId);
    const a = game.spawn(hostE.def(), p0.clone(), 0);
    a.yaw = yaw;
    const aKit = hostE.kit(a, game);
    const b = game.spawn(guestE.def(), new THREE.Vector3(bx, groundAt(world, bx, bz) + 0.05, bz), 1);
    b.yaw = yaw + Math.PI;
    const bKit = guestE.kit(b, game);
    const host = netRole === 'host';
    player = host ? a : b;
    kit = host ? aKit : bKit;
    playerEntry = host ? hostE : guestE;
    remote = host ? { f: b, kit: bKit } : { f: a, kit: aKit };
    // only its owner can down the other player's fighter (its snapshot says so); here it just takes the blows
    remote.f.immortal = true;
    game.controllers.push(new PlayerController(game, player, kit));
    game.controllers.push(new PlayerController(game, remote.f, remote.kit, session!.remotePad, session!.remotePad, false));
    hud.abilityProvider = () => kit.abilities();
    hud.formProvider = () => kit.formName();
    hud.rival = remote.f;
    game.cam.yaw = player.yaw + Math.PI;
    netDeadT = 0;
  };
  const beginOnline = (hostId: string, guestId: string) => {
    if (!net) return;
    goLive();
    mode = 'online';
    unlimited = false;
    hollowsOn = false;
    session = new NetSession(game, net, { me: () => (player ? { f: player, kit } : null), them: () => remote });
    spawnPair(hostId, guestId);
    session.onRound = (n) => {
      netRound = n;
      spawnPair(hostId, guestId);
      hud.showBanner(`ROUND ${n}`, 2);
    };
    session.onBye = () => {
      hud.showBanner('PLAYER 2 LEFT<br><small style="font-size:14px;letter-spacing:4px">back to the title in a moment</small>', 4);
      mode = 'sandbox';
      setTimeout(() => location.reload(), 4500);
    };
    eng.systems.push({
      update: (dt) => {
        if (mode !== 'online' || !session) return;
        session.step(dt);
        // the host calls the next round a few seconds after someone falls
        if (netRole === 'host' && (player.dead || remote?.f.dead)) {
          netDeadT += dt;
          if (netDeadT > 4.5) {
            netRound++;
            session.round = netRound;
            net?.send({ t: 'round', n: netRound });
            spawnPair(hostId, guestId);
            hud.showBanner(`ROUND ${netRound}`, 2);
          }
        }
      },
    });
    const hn = rosterEntry(hostId).name.toUpperCase(), gn = rosterEntry(guestId).name.toUpperCase();
    hud.showBanner(`${hn} <small>vs</small> ${gn}<br><small style="font-size:14px;letter-spacing:6px">VS PLAYER 2 · ${placeName}</small>`, 3);
    idle(() => { rosterEntry(hostId).warm?.(); rosterEntry(guestId).warm?.(); });
  };

  document.getElementById('boot')?.remove();
  eng.start();
  // attract camera until PLAY, then pause whenever the pointer lock is released (never in Vs Player 2: the match goes on)
  const canvas = eng.gr.renderer.domElement;
  let attractT = 0;
  let pause: { show: (on: boolean) => void } | null = null;
  function goLive(): void {
    if (started && !game.cam.override) return;
    started = true;
    game.cam.override = null;
    game.input.enabled = true;
    hud.root.style.display = '';
    game.sfx.unlock();
    lockPointer(canvas);
    document.addEventListener('pointerlockchange', () => {
      const locked = document.pointerLockElement === canvas;
      const hold = !locked && mode !== 'online';
      pause?.show(hold);
      eng.paused = hold;
    });
  }
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
    pause = pauseOverlay(app, () => lockPointer(canvas));
    const init: StartChoice = { char: playerEntry.id, mode, vs: rivalEntry.id, hollows: hollowsOn };
    const mapLink = new URL(location.href);
    if (town) mapLink.searchParams.set('map', 'arena');
    else mapLink.searchParams.delete('map');
    startUi = showStart(app, ROSTER, init, (c) => {
      if (c.mode === 'online') {
        if (!net || !peerChar) return;
        net.send({ t: 'start', host: c.char, guest: peerChar, map: mapName });
        beginOnline(c.char, peerChar);
        return;
      }
      goLive();
      if (c.char !== playerEntry.id) setPlayer(rosterEntry(c.char), player.pos.clone(), player.yaw);
      if (c.mode === 'duel') {
        mode = 'duel';
        const r = startDuel(rosterEntry(c.vs));
        hud.showBanner(`${player.name.toUpperCase()} <small>vs</small> ${r.name.toUpperCase()}<br><small style="font-size:14px;letter-spacing:6px">${placeName}</small>`, 3);
      } else {
        mode = 'sandbox';
        unlimited = true;
        hollowsOn = c.hollows;
        hud.showBanner(`${placeName}<br><small style="font-size:14px;letter-spacing:4px">${c.hollows ? 'Sandbox · Hollows incoming' : 'Sandbox · no limits'}</small>`, 3);
      }
    }, quality === QUALITY_LOW ? 'low' : 'high', netUi, { name: town ? 'Karakura Town' : 'Training Grounds', other: town ? 'Training Grounds' : 'Karakura Town', href: mapLink.toString() });
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
      game.cam.snap();
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
    freeze: (on = true) => { eng.paused = on; },
    /** blast a sphere out of the world (tests: craters to restore, walls to cut) */
    carve: (x: number, y: number, z: number, r: number, mode: CarveMode = 'smash', power = 600) => eng.destruction.carve(new SphereShape(new THREE.Vector3(x, y, z), r), { mode, power }).removed,
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
