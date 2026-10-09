// Film runtime (evaluated in the game page by tools/video/record.mjs before the film file).
//
// A film is a list of shots on one timeline: film({ shots: [{ name, dur, setup(c), update(c), at: [[t, fn], ...],
// card, cine, fov, fade }] }). Each frame the runtime steps the game exactly like its own loop (hitstop and slow
// motion included), runs the shot's events and camera, lays the overlays (letterbox, title cards, fades, flashes) and
// renders once. Helpers live on window.F (cast, place, cameras, AIs, cards).
(() => {
  const r = window.__reishi, g = r.game, eng = r.engine;
  const V = r.player.pos.constructor;
  const SIM_DT = 1 / 60;
  const app = document.getElementById('app') || document.body;

  // ---------------------------------------------------------------- overlays
  document.getElementById('film')?.remove();
  document.getElementById('film-css')?.remove();
  const css = document.createElement('style');
  css.id = 'film-css';
  css.textContent = `
  #film { position: absolute; inset: 0; pointer-events: none; z-index: 50; overflow: hidden; font-family: 'Zen Kaku Gothic New', sans-serif; color: #f3f1ec; }
  #film .lb { position: absolute; left: 0; right: 0; height: 0; background: #050507; transition: none; }
  #film .lb.t { top: 0; } #film .lb.b { bottom: 0; }
  #film .fx { position: absolute; inset: 0; background: #000; opacity: 0; }
  #film .fl { position: absolute; inset: 0; background: #fff; opacity: 0; mix-blend-mode: screen; }
  #film .card { position: absolute; inset: 0; opacity: 0; }
  #film .grain { position: absolute; inset: -50%; opacity: .05; background-image: repeating-radial-gradient(circle at 17% 32%, #fff 0 1px, transparent 1px 3px); }
  body.cine #hud .plate, body.cine #hud .abil, body.cine #hud .lock, body.cine #hud .combo, body.cine #hud .boss, body.cine #hud .help, body.cine #hud .dmg, body.cine #hud .banner { display: none !important; }
  body.nohud #hud { display: none !important; }
  body.cine #hud .callout { transform: scale(1.15); }
  /* cards */
  .fc-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
  .fc-kj { font-family: 'Yuji Syuku', serif; line-height: 1; color: #f3f1ec; }
  .fc-big { font-family: 'Dela Gothic One', sans-serif; letter-spacing: .18em; color: #f3f1ec; }
  .fc-sm { font-size: 18px; letter-spacing: .55em; text-transform: uppercase; opacity: .85; }
  .fc-line { height: 2px; background: linear-gradient(90deg, transparent, var(--c, #9fe6ff), transparent); }
  .fc-name { position: absolute; left: 7%; bottom: 17%; }
  .fc-name .n { font-family: 'Dela Gothic One', sans-serif; font-size: 74px; letter-spacing: .06em; line-height: 1; text-shadow: 0 4px 0 rgba(0,0,0,.6), 0 0 30px rgba(0,0,0,.6); }
  .fc-name .t { font-size: 17px; letter-spacing: .5em; text-transform: uppercase; margin-top: 12px; color: var(--c); text-shadow: 0 2px 6px #000; }
  .fc-name .bar { position: absolute; left: -40px; right: -60px; top: 18px; height: 70px; background: linear-gradient(90deg, rgba(5,5,8,.85), rgba(5,5,8,.55) 70%, transparent); transform: skewX(-18deg); z-index: -1; }
  .fc-vk { position: absolute; right: 6.5%; top: 14%; writing-mode: vertical-rl; font-family: 'Yuji Syuku', serif; font-size: 118px; line-height: 1; color: var(--c); text-shadow: 0 0 24px rgba(0,0,0,.8), 0 0 2px #000; }
  .fc-logo { width: 74%; }
  .fc-logo .w { font-family: 'Dela Gothic One', sans-serif; font-size: 92px; paint-order: stroke; stroke: #0b0b10; stroke-width: 7px; stroke-linejoin: round; }
  .fc-logo .kj { font-family: 'Yuji Syuku', serif; font-size: 210px; fill: rgba(125,223,253,.09); }
  .fc-logo .kjs { font-family: 'Yuji Syuku', serif; font-size: 30px; fill: #cfefff; letter-spacing: .5em; }
  .fc-quote { font-family: 'Yuji Syuku', serif; font-size: 40px; letter-spacing: .12em; line-height: 1.6; text-shadow: 0 0 20px #000; }
  `;
  document.head.appendChild(css);
  const root = document.createElement('div');
  root.id = 'film';
  root.innerHTML = `<div class="card"></div><div class="lb t"></div><div class="lb b"></div><div class="fl"></div><div class="fx"></div>`;
  app.appendChild(root);
  const elCard = root.querySelector('.card'), elT = root.querySelector('.lb.t'), elB = root.querySelector('.lb.b');
  const elFx = root.querySelector('.fx'), elFl = root.querySelector('.fl');
  const H = () => window.innerHeight;

  // ---------------------------------------------------------------- helpers
  const sstep = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const v3 = (a) => (a instanceof V ? a.clone() : new V(a[0], a[1], a[2]));
  const home = { pos: r.player.pos.clone(), yaw: r.player.yaw };
  const world = eng.world, vs = world.vs;
  const ground = (x, z, top = 46) => {
    const ix = Math.floor(x / vs), iz = Math.floor(z / vs);
    for (let iy = Math.floor(top / vs); iy > 0; iy--) if (world.isSolid(ix, iy, iz)) return (iy + 1) * vs;
    return 32;
  };
  let flash = 0, flashColor = '#fff';
  const mods = {};

  const F = (window.F = {
    r, g, eng, V, home, ground, sstep, lerp,
    get p() { return r.player; },
    get k() { return r.kit; },
    get o() { return r.rival; },
    get ok() { return r.rivalKit; },
    /** a point along the town's main street: off metres from the spawn, side metres to its right */
    street(off, side = 0, yaw = home.yaw) {
      const fx = Math.sin(yaw), fz = Math.cos(yaw);
      const x = home.pos.x + fx * off - fz * side, z = home.pos.z + fz * off + fx * side;
      return new V(x, ground(x, z), z);
    },
    /** ground point at (x, z) */
    at(x, z) { return new V(x, ground(x, z), z); },
    /** a named place of the town (park, school, river, bridge, station…) offset by dx, dz */
    spot(name, dx = 0, dz = 0) { const s = r.spots[name]; return F.at(s[0] + dx, s[1] + dz); },
    /** yaw that looks from a to b */
    yawTo(a, b) { return Math.atan2(b.x - a.x, b.z - a.z); },
    /** a flat stretch of street at least `need` metres long, searched forward from off */
    flat(off, need = 16, side = 0) {
      for (let n = 0; n < 14; n++) {
        const a = F.street(off + n * 3, side), b = F.street(off + n * 3 + need, side);
        if (Math.abs(a.y - home.pos.y) < 0.7 && Math.abs(b.y - home.pos.y) < 0.7) return off + n * 3;
      }
      return off;
    },
    /** load a module of the game (same instance the game uses) */
    mod: async (name) => (mods[name] ??= await import(name)),
    /** put fighter f at p facing yaw, still and whole */
    put(f, p, yaw) {
      f.stopAction?.();
      f.body.pos.copy(p); f.body.prev.copy(p); f.body.vel.set(0, 0, 0); f.push?.set(0, 0, 0);
      if (yaw !== undefined) f.yaw = yaw;
      f.hitstun = 0;
      f.dead = false;
      if (f.visual) f.visual.object.visible = true;
    },
    heal(f) { f.hp = f.maxHp; f.rei = f.maxRei; },
    /** remove every controller of f (it stands still unless the film moves it) */
    still(f) { for (let i = g.controllers.length - 1; i >= 0; i--) if (g.controllers[i].f === f) g.controllers.splice(i, 1); },
    /** hand f to the duel AI */
    async ai(f, kit, aggression = 0.85) {
      F.still(f);
      const { DuelistAI } = await F.mod('/src/game/ai/duelist.ts');
      g.controllers.push(new DuelistAI(g, f, kit, { aggression, intro: 0 }));
    },
    /** play as a roster character and face a rival: d metres ahead on the street at `off` */
    cast(pid, oid, off = 0, d = 12, opts = {}) {
      if (r.kit && r.player.def.id !== pid) r.setChar(pid);
      else if (!r.kit) r.setChar(pid);
      const p = r.player;
      F.still(p);
      const yaw = opts.yaw ?? home.yaw;
      const a = opts.at ?? F.street(off, opts.side ?? 0);
      F.put(p, a, yaw);
      F.heal(p);
      if (oid) {
        const o = r.duel(oid, d);
        F.still(o);
        const b = opts.oAt ?? new V(a.x + Math.sin(yaw) * d, 0, a.z + Math.cos(yaw) * d);
        b.y = ground(b.x, b.z);
        F.put(o, b, yaw + Math.PI);
        F.heal(o);
        o.onLethal = () => { o.hp = 1; return true; };
      }
      p.onLethal = () => { p.hp = 1; return true; };
      F.face();
      return p;
    },
    /** turn both fighters toward each other */
    face() {
      const p = r.player, o = r.rival;
      if (!o) return;
      p.faceTarget = o.center();
      p.yaw = Math.atan2(o.pos.x - p.pos.x, o.pos.z - p.pos.z);
      o.yaw = Math.atan2(p.pos.x - o.pos.x, p.pos.z - o.pos.z);
    },
    /** another fighter from the roster, with its kit (and optionally the duel AI) */
    async extra(id, at, team = 1, yaw = 0) {
      const { rosterEntry } = await F.mod('/src/game/roster.ts');
      const e = rosterEntry(id);
      const f = g.spawn(e.def(), v3(at), team);
      f.yaw = yaw;
      const kit = e.kit(f, g);
      f.onLethal = () => { f.hp = 1; return true; };
      return { f, kit };
    },
    clearExtras() {
      for (const f of [...g.fighters]) if (f !== r.player && f !== r.rival) g.remove(f);
    },
    /** release n times, skipping the cinematics (the sim runs) */
    release(kit, f, n = 1, steps = 140) {
      for (let i = 0; i < n; i++) { f.stopAction?.(); f.rei = f.maxRei; if (kit.cd) for (const c of Object.keys(kit.cd)) kit.cd[c] = 0; kit.release(); eng.advance(steps); }
      F.heal(f);
    },
    /** release n times off-camera (the riverside strip south of the river), then come back to `to` facing yaw */
    backstage(kit, f, n, to, yaw, steps = 150) {
      F.bs = ((F.bs ?? 0) + 1) % 14;
      const b = F.at(14 + F.bs * 21, 282);
      F.put(f, b, Math.PI / 2);
      F.release(kit, f, n, steps);
      F.put(f, to, yaw);
      F.quiet();
      if (f.aura) { f.aura.hold = 0; f.aura.flareLevel = 0; f.aura.pillarT = 0; if (f.aura.pillar) f.aura.pillar.visible = false; }
    },
    ready(kit, f) { f.stopAction?.(); f.rei = f.maxRei; if (kit.cd) for (const c of Object.keys(kit.cd)) kit.cd[c] = 0; },
    // cameras
    cam(pos, at) { g.cam.override = { pos: v3(pos), target: v3(at) }; },
    follow(yaw, pitch = 0.16, dist = 5) { g.cam.override = null; if (yaw !== undefined) { g.cam.yaw = yaw; g.cam.pitch = pitch; g.cam.dist = dist; g.cam.snap(); } },
    /** a point relative to fighter f (or a position) in the frame of yaw: back, up, right */
    rel(f, back, up, right = 0, yaw) {
      const c = f.pos ? f.pos : f;
      const y = yaw ?? (f.yaw ?? home.yaw);
      const fx = Math.sin(y), fz = Math.cos(y);
      return new V(c.x - fx * back + fz * right, c.y + up, c.z - fz * back - fx * right);
    },
    /** interpolate camera keys [[u, pos, at], ...] at u (0..1), eased between keys */
    path(u, keys, ease = true) {
      let i = 0;
      while (i < keys.length - 2 && u > keys[i + 1][0]) i++;
      const [u0, p0, a0] = keys[i], [u1, p1, a1] = keys[Math.min(i + 1, keys.length - 1)];
      const t = u1 > u0 ? Math.min(1, Math.max(0, (u - u0) / (u1 - u0))) : 1;
      const e = ease ? sstep(t) : t;
      const P0 = typeof p0 === 'function' ? p0() : v3(p0), P1 = typeof p1 === 'function' ? p1() : v3(p1);
      const A0 = typeof a0 === 'function' ? a0() : v3(a0), A1 = typeof a1 === 'function' ? a1() : v3(a1);
      F.cam(P0.lerp(P1, e), A0.lerp(A1, e));
    },
    /** orbit round a centre */
    orbit(c, radius, height, a, lookUp = 1) {
      const C = v3(c);
      F.cam(new V(C.x + Math.cos(a) * radius, C.y + height, C.z + Math.sin(a) * radius), new V(C.x, C.y + lookUp, C.z));
    },
    fov(deg) { const cam = g.cam.cam; cam.fov = deg; cam.updateProjectionMatrix(); },
    flash(a = 1, color = '#fff') { flash = Math.max(flash, a); flashColor = color; },
    shake(a) { g.cam.addTrauma(a); },
    callout(kj, rm, color) { g.hud?.callout(kj, rm, color); },
    quiet() { if (g.hud) g.hud.calloutT = 0; },
    // cards (HTML)
    cards: {
      title: (kj, big, sm, c = '#9fe6ff') => `<div class="fc-center" style="--c:${c};background:#050507">
        <div class="fc-kj" style="font-size:300px;position:absolute;opacity:.07">${kj}</div>
        <div class="fc-big" style="font-size:54px">${big}</div>
        <div class="fc-line" style="width:520px;margin:18px 0"></div>
        <div class="fc-sm">${sm}</div></div>`,
      kanji: (kj, sm, c = '#f3f1ec', bg = '#050507') => `<div class="fc-center" style="--c:${c};background:${bg}">
        <div class="fc-kj" style="font-size:260px;color:${c};text-shadow:0 0 40px ${c}55">${kj}</div>
        ${sm ? `<div class="fc-sm" style="margin-top:26px">${sm}</div>` : ''}</div>`,
      quote: (text, c = '#9fe6ff') => `<div class="fc-center" style="--c:${c};background:#050507">
        <div class="fc-quote">${text}</div><div class="fc-line" style="width:360px;margin-top:28px"></div></div>`,
      line: (text, sub = '', c = '#9fe6ff') => `<div class="fc-center" style="--c:${c};background:#050507">
        <div class="fc-big" style="font-size:44px">${text}</div>${sub ? `<div class="fc-line" style="width:420px;margin:16px 0"></div><div class="fc-sm">${sub}</div>` : ''}</div>`,
      name: (name, title, kj, c = '#9fe6ff') => `<div style="--c:${c};position:absolute;inset:0">
        <div class="fc-vk">${kj}</div>
        <div class="fc-name"><div class="bar"></div><div class="n">${name}</div><div class="t">${title}</div></div></div>`,
      logo: (sub, bg = '#050507') => `<div class="fc-center" style="background:${bg}">
        <div class="fc-logo">${F.LOGO}</div>${sub ? `<div class="fc-sm" style="margin-top:28px">${sub}</div>` : ''}</div>`,
      lower: (text, c = '#9fe6ff') => `<div style="--c:${c};position:absolute;left:0;right:0;bottom:15%;text-align:center">
        <div class="fc-big" style="font-size:30px;text-shadow:0 2px 12px #000">${text}</div></div>`,
    },
  });

  // ---------------------------------------------------------------- the timeline
  let def = null, fps = 24, shots = [], cur = -1, acc = 0, shotStart = 0, fastMode = false, skipDt = 0;
  window.film = (d) => { def = d; };
  const ctx = { t: 0, u: 0, dt: 0, F };
  const black = () => {
    const gl = eng.gr.renderer.getContext(), px = new Uint8Array(4);
    let sum = 0;
    for (const [fx, fy] of [[0.5, 0.95], [0.5, 0.5], [0.2, 0.6], [0.8, 0.35], [0.35, 0.15]]) {
      gl.readPixels(Math.floor(gl.drawingBufferWidth * fx), Math.floor(gl.drawingBufferHeight * fy), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      sum += px[0] + px[1] + px[2];
    }
    return sum === 0;
  };
  const stepLikeTheLoop = (dt) => {
    if (eng.hitstop > 0) eng.hitstop = Math.max(0, eng.hitstop - dt);
    else {
      acc += dt * eng.timeScale;
      let n = 0;
      while (acc >= SIM_DT && n < 6) { eng.step(SIM_DT); acc -= SIM_DT; n++; }
    }
  };
  window.__film = {
    async init(f, fast = false) {
      fps = f;
      fastMode = fast;
      cur = -1; acc = 0; skipDt = 0;
      eng.stop();
      eng.paused = true;
      F.LOGO = (await F.mod('/src/ui/start.ts')).LOGO;
      shots = def.shots;
      let t = 0;
      for (const s of shots) { s.start = t; t += s.dur; s.at = (s.at ?? []).slice().sort((a, b) => a[0] - b[0]); s.fired = 0; }
      if (def.init) await def.init(F);
      return Math.round(t * fps);
    },
    frame(fi, save) {
      const T = fi / fps, dt = 1 / fps;
      let i = cur < 0 ? 0 : cur;
      while (i < shots.length - 1 && T >= shots[i + 1].start - 1e-9) i++;
      const s = shots[i];
      if (i !== cur) {
        cur = i;
        shotStart = T;
        document.body.classList.toggle('cine', s.hud !== 'game');
        document.body.classList.toggle('nohud', s.hud === 'none');
        F.fov(s.fov ?? 50);
        elCard.innerHTML = s.card ?? '';
        try { s.setup?.(ctx); } catch (e) { console.error('[film] setup ' + s.name + ': ' + e.message); }
      }
      ctx.t = T - s.start; ctx.u = ctx.t / s.dur; ctx.dt = dt;
      while (s.fired < s.at.length && s.at[s.fired][0] <= ctx.t + 1e-6) {
        const ev = s.at[s.fired++];
        try { ev[1](ctx); } catch (e) { console.error('[film] event ' + s.name + '@' + ev[0] + ': ' + e.message); }
      }
      if (!s.frozen) stepLikeTheLoop(dt);
      try { s.update?.(ctx); } catch (e) { console.error('[film] update ' + s.name + ': ' + e.message); }
      // the cinematic camera shakes too (the game's own shake is skipped under an override)
      const ov = g.cam.override;
      if (ov && g.cam.trauma > 0) {
        const k = g.cam.trauma * g.cam.trauma * 0.35, tt = T * 37;
        ov.pos.x += Math.sin(tt * 1.7) * k; ov.pos.y += Math.sin(tt * 2.3 + 1) * k; ov.target.x += Math.sin(tt * 1.3 + 2) * k * 0.5;
      }
      g.cam.trauma = Math.max(0, (g.cam.trauma ?? 0) - dt * 1.4);
      // overlays: letterbox, card, fades, flash
      const lb = s.cine === false ? 0 : (s.lb ?? 0.1) * H();
      elT.style.height = elB.style.height = lb + 'px';
      const ci = s.cardIn ?? 0.35, co = s.cardOut ?? 0.35, cf = s.cardFrom ?? 0, ct = s.cardTo ?? s.dur;
      const cardA = s.card ? Math.min(sstep((ctx.t - cf) / ci), sstep((ct - ctx.t) / co)) : 0;
      elCard.style.opacity = String(cardA);
      const fi0 = s.fadeIn ?? 0, fo = s.fadeOut ?? 0;
      let fx = 0;
      if (fi0 > 0) fx = Math.max(fx, 1 - sstep(ctx.t / fi0));
      if (fo > 0) fx = Math.max(fx, sstep((ctx.t - (s.dur - fo)) / fo));
      elFx.style.opacity = String(fx);
      elFl.style.background = flashColor;
      elFl.style.opacity = String(flash);
      flash = Math.max(0, flash - dt * 3.2);
      // a card on solid black needs no 3D frame
      const cardCovers = s.card && s.opaque !== false && cardA > 0.999 && /background:#050507/.test(s.card);
      if (fastMode && !save) { skipDt += dt; return { pending: 0, shot: s.name }; }
      if (!cardCovers || !save) {
        eng.renderFrame(dt + skipDt, acc / SIM_DT);
        skipDt = 0;
        if (save) for (let k = 0; k < 12 && black(); k++) eng.renderFrame(1e-4, acc / SIM_DT);
      }
      return { pending: save && !cardCovers ? eng.pendingWork : 0, shot: s.name };
    },
    flush() {
      eng.renderFrame(1e-4, acc / SIM_DT);
      return { pending: eng.pendingWork, shot: shots[cur]?.name };
    },
  };
})();
