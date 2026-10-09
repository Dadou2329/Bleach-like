// Deterministic video capture: the game is stepped like its own loop (hitstop, slow motion) at a fixed frame rate,
// one screenshot per frame, then encoded with ffmpeg.
//
// Usage:
//   node tools/video/record.mjs --film tools/video/films/trailer.js --out shots/video/trailer [--w 1280 --h 720]
//        [--fps 24] [--every 1] [--from 0 --to 90] [--port 5401] [--url "/?char=ichigo&vs=grimmjow&hollows=0&q=low&autostart"]
//
// The film file runs in the page after the game is ready. It calls film({ url?, shots: [...] }) (see film.js). With
// --every N only every Nth frame is saved (a preview; the game still runs every frame). --from/--to (seconds) save only
// that span (the film still runs from its start, so what happens is the same). Frames land in <out>/f%05d.jpg.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return acc;
  }, []),
);
const PORT = Number(args.port ?? 5401);
const W = Number(args.w ?? 1280), H = Number(args.h ?? 720);
const FPS = Number(args.fps ?? 24);
const EVERY = Number(args.every ?? 1);
const OUT = String(args.out ?? 'shots/video/film');
const filmSrc = fs.readFileSync(String(args.film), 'utf8');
const runtime = fs.readFileSync(new URL('./film.js', import.meta.url), 'utf8');
// the film file names its own URL (first line: // url: /?...), unless --url says otherwise
const urlLine = /\/\/\s*url:\s*(\S+)/.exec(filmSrc);
const URL0 = String(args.url ?? (urlLine ? urlLine[1] : '/?char=ichigo&vs=grimmjow&hollows=0&q=low&autostart'));

function ping(url) {
  return new Promise((res) => {
    http.get(url, (r) => { r.resume(); res(r.statusCode < 500); }).on('error', () => res(false));
  });
}
async function ensureServer() {
  const base = `http://127.0.0.1:${PORT}`;
  if (await ping(base + '/')) return { base, proc: null };
  const proc = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', 'tools/shots/vite.shots.config.ts', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { stdio: ['ignore', 'pipe', 'pipe'] });
  proc.stderr.on('data', (d) => process.stderr.write(d));
  for (let i = 0; i < 120; i++) {
    if (await ping(base + '/')) return { base, proc };
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('vite did not start');
}

const { base, proc } = await ensureServer();
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--autoplay-policy=no-user-gesture-required'],
});
const log = (o) => console.log(JSON.stringify(o));
let code = 0;
try {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); if (m.text().startsWith('[film]')) console.log(m.text()); });
  page.on('pageerror', (e) => { errors.push('pageerror: ' + e.message); });
  const t0 = Date.now();
  await page.goto(base + URL0, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction('window.__reishi && window.__reishi.ready()', null, { timeout: 600000, polling: 250 });
  await page.evaluate(runtime);
  await page.evaluate(`(async () => { ${filmSrc}\n })()`);
  const total = await page.evaluate(`__film.init(${FPS})`);
  const from = Math.floor(Number(args.from ?? 0) * FPS), to = Math.min(total, Math.ceil(Number(args.to ?? 1e9) * FPS));
  fs.mkdirSync(OUT, { recursive: true });
  log({ msg: 'start', frames: total, from, to, loadMs: Date.now() - t0 });
  const tStart = Date.now();
  for (let f = 0; f < to; f++) {
    const save = f >= from && (f - from) % EVERY === 0;
    // step + render this frame (cards and cameras included); the page says whether meshing is still behind
    let st = await page.evaluate(`__film.frame(${f}, ${save})`);
    if (!save) continue;
    // destruction is meshed in workers: give them the time they need, so a cut shows on the frame it happens
    for (let k = 0; st.pending > 0 && k < 60; k++) {
      await page.waitForTimeout(40);
      st = await page.evaluate('__film.flush()');
    }
    // a starved SwiftShader can take a while to hand over a frame: wait, and try again rather than lose the frame
    const file = path.join(OUT, `f${String(f).padStart(5, '0')}.jpg`);
    for (let tries = 0; tries < 3; tries++) {
      try { await page.screenshot({ path: file, type: 'jpeg', quality: 92, timeout: 240000 }); break; } catch (e) { errors.push(`shot ${f}: ` + e.message.split('\n')[0]); }
    }
    if (f % 48 === 0) {
      const el = (Date.now() - tStart) / 1000;
      log({ frame: f, of: to, shot: st.shot, sec: +(f / FPS).toFixed(1), elapsed: Math.round(el), eta: Math.round((el / Math.max(1, f - from + 1)) * (to - f)) });
    }
  }
  log({ msg: 'done', ms: Date.now() - t0, errors: errors.slice(0, 20) });
} catch (e) {
  console.error(e);
  code = 1;
} finally {
  await browser.close();
  if (proc) proc.kill();
}
process.exit(code);
