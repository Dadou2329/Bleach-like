// Vs Player 2 smoke test: two tabs of one headless browser join a lobby over the local BroadcastChannel transport
// (?net=local), the host starts, then tab A walks and attacks while both tabs report what they see.
//   node tools/shots/netplay.mjs [--port 5461] [--map arena] [--a ichigo] [--b grimmjow] [--real 1]
// --real 1 goes through the real lobby broker and WebRTC instead (needs network access).
// Writes shots/net-A.png and shots/net-B.png.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import http from 'node:http';
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1]]] : acc), []));
const PORT = Number(args.port ?? 5461);
const MAP = args.map === 'town' ? '' : '&map=arena';
const CA = args.a ?? 'ichigo', CB = args.b ?? 'grimmjow';
const NET = args.real ? '' : '&net=local';
const ping = (u) => new Promise((r) => http.get(u, (x) => { x.resume(); r(true); }).on('error', () => r(false)));
let proc = null;
if (!(await ping(`http://127.0.0.1:${PORT}/`))) {
  proc = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', 'tools/shots/vite.shots.config.ts', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' });
  for (let i = 0; i < 120 && !(await ping(`http://127.0.0.1:${PORT}/`)); i++) await new Promise((r) => setTimeout(r, 500));
}
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
try {
  const ctx = await b.newContext({ viewport: { width: 640, height: 360 } });
  const A = await ctx.newPage(), B = await ctx.newPage();
  for (const [n, p] of [['A', A], ['B', B]]) {
    p.on('pageerror', (e) => log(n, 'PAGEERROR', e.message));
    p.on('console', (m) => { if (m.type() === 'error') log(n, 'console.error', m.text().slice(0, 200)); });
  }
  await A.goto(`http://127.0.0.1:${PORT}/?q=low${MAP}${NET}&char=${CA}`);
  await A.waitForFunction('window.__reishi && window.__reishi.ready()', null, { timeout: 600000 });
  log('A ready');
  await A.click('.mode[data-mode="online"]');
  await A.click('.lobby .host');
  const code = (await A.textContent('#start .code')).trim();
  log('lobby code', code, '| A status:', await A.textContent('#start .status'));
  await B.goto(`http://127.0.0.1:${PORT}/?q=low${MAP}${NET}&char=${CB}&join=${code}`);
  await B.waitForFunction('window.__reishi && window.__reishi.ready()', null, { timeout: 600000 });
  log('B ready | B status:', await B.textContent('#start .status'));
  await A.waitForFunction(() => /Player 2 is in/.test(document.querySelector('#start .status')?.textContent ?? ''), null, { timeout: 120000 });
  log('A status:', await A.textContent('#start .status'), '| B status:', await B.textContent('#start .status'));
  await A.click('#start .play');
  await B.waitForFunction(() => !document.querySelector('#start') || getComputedStyle(document.querySelector('#start')).opacity === '0', null, { timeout: 120000 });
  log('started');
  const st = async (p) => p.evaluate(() => { const r = window.__reishi; const g = r.game; return { me: r.player.name, mePos: r.player.pos.toArray().map((v) => +v.toFixed(1)), them: g.hud.rival?.name, themPos: g.hud.rival?.pos.toArray().map((v) => +v.toFixed(1)), themAct: g.hud.rival?.action?.name ?? null, meHp: Math.round(r.player.hp), themHp: Math.round(g.hud.rival?.hp ?? -1), n: g.fighters.length, t: +g.time.toFixed(1) }; });
  log('A', JSON.stringify(await st(A)));
  log('B', JSON.stringify(await st(B)));
  // A walks forward for a while; B must see A's fighter move
  await A.evaluate(() => { const r = window.__reishi; r.game.input.enabled = true; r.tap('KeyW', 6000); });
  for (let i = 0; i < 4; i++) {
    await new Promise((r) => setTimeout(r, 8000));
    log('A', JSON.stringify(await st(A)));
    log('B', JSON.stringify(await st(B)));
  }
  // A attacks; B's copy of A should swing
  await A.evaluate(() => { for (let i = 0; i < 4; i++) setTimeout(() => window.__reishi.tap('Mouse0', 80), i * 400); });
  for (let i = 0; i < 3; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    log('A', JSON.stringify(await st(A)));
    log('B', JSON.stringify(await st(B)));
  }
  await A.screenshot({ path: 'shots/net-A.png' });
  await B.screenshot({ path: 'shots/net-B.png' });
  // B falls: both sides see it, and the host calls round 2 (both fighters back at their marks, full HP)
  await B.evaluate(() => { const r = window.__reishi; r.game.damage(r.player, 1e6, null, r.player.forward(), {}); });
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 6000));
    const a = await st(A), bb = await st(B);
    const bDead = await B.evaluate(() => !!window.__reishi.player.dead);
    log('A', JSON.stringify(a));
    log('B', JSON.stringify(bb), 'deadMe=', bDead);
    if (i > 2 && a.n === 2 && bb.n === 2 && !bDead && a.themHp > 0) {
      log('round 2 on both tabs');
      break;
    }
  }
  // B leaves: A is told
  await B.close();
  await new Promise((r) => setTimeout(r, 4000));
  log('A banner after B left:', await A.evaluate(() => document.querySelector('#hud .banner')?.textContent ?? '(no banner element)'));
} finally {
  await b.close();
  if (proc) proc.kill();
}
