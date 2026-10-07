// Headless screenshot harness (Playwright + pre-installed Chromium, SwiftShader WebGL).
//
// Usage:
//   node tools/shots/shoot.mjs --url "/?cam=30,14,22,42,5,52" --out shots/arena.png [--w 1280 --h 720]
//   node tools/shots/shoot.mjs --url "/dev/model.html?id=ichigo" --out shots/ichigo.png --wait "window.__ready"
//
// Starts (or reuses) a Vite dev server, opens the page, waits until `window.__reishi.ready()` (or the
// --wait expression) is truthy, then saves a PNG and prints any stats + console errors.
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
const PORT = Number(args.port ?? 5199);
const W = Number(args.w ?? 1280), H = Number(args.h ?? 720);
const outs = String(args.out ?? 'shots/shot.png').split(',');
const urls = String(args.url ?? '/').split('|');
const waitExpr = String(args.wait ?? '(window.__reishi && window.__reishi.ready())');
const timeout = Number(args.timeout ?? 180000);
const settle = Number(args.settle ?? 0);
// optional JS to run after the first ready (e.g. "__reishi.demo('slice'); __reishi.advance(40)"),
// then wait for ready again before the screenshot. Multiple scripts separated by '||' → one shot each.
const scripts = args.script ? String(args.script).split('||') : [];

function ping(url) {
  return new Promise((res) => {
    http.get(url, (r) => { r.resume(); res(r.statusCode < 500); }).on('error', () => res(false));
  });
}

async function ensureServer() {
  const base = `http://127.0.0.1:${PORT}`;
  if (await ping(base + '/')) return { base, proc: null };
  const proc = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', 'tools/shots/vite.shots.config.ts', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  proc.stderr.on('data', (d) => process.stderr.write(d));
  for (let i = 0; i < 120; i++) {
    if (await ping(base + '/')) return { base, proc };
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('vite did not start');
}

// Re-render the game frame (a negligible step) and sample a few pixels; if the 3D canvas came out fully black,
// render again (up to 12 times). Returns the number of retries, -1 if every frame was black, 'na' outside the game.
const BLACK_GUARD = `(() => {
  const eng = window.__reishi && window.__reishi.engine;
  if (!eng || !eng.gr || !eng.renderFrame) return 'na';
  const gl = eng.gr.renderer.getContext();
  const px = new Uint8Array(4);
  const black = () => {
    let sum = 0;
    for (const [fx, fy] of [[0.5, 0.95], [0.5, 0.5], [0.2, 0.6], [0.8, 0.35], [0.35, 0.15]]) {
      gl.readPixels(Math.floor(gl.drawingBufferWidth * fx), Math.floor(gl.drawingBufferHeight * fy), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      sum += px[0] + px[1] + px[2];
    }
    return sum === 0;
  };
  for (let i = 0; i < 12; i++) {
    eng.renderFrame(1e-4, 1);
    if (!black()) return i;
  }
  return -1;
})()`;

const { base, proc } = await ensureServer();
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
});
let exitCode = 0;
try {
  for (let i = 0; i < urls.length; i++) {
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
    page.on('pageerror', (e) => { errors.push(`pageerror: ${e.message}`); page.evaluate(() => { window.__pageError = true; }).catch(() => {}); });
    const t0 = Date.now();
    await page.goto(base + urls[i], { waitUntil: 'load', timeout });
    try {
      await page.waitForFunction(`(window.__pageError) || (${waitExpr})`, null, { timeout, polling: 250 });
    } catch (e) {
      errors.push('wait timeout: ' + e.message.split('\n')[0]);
      exitCode = 1;
    }
    if (settle) await page.waitForTimeout(settle);
    const out = outs[i] ?? outs[0].replace(/\.png$/, `-${i}.png`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    if (scripts.length === 0) await page.screenshot({ path: out, timeout: 180000 });
    const black = [];
    for (let s = 0; s < scripts.length; s++) {
      await page.evaluate(scripts[s]);
      await page.waitForFunction(`(window.__pageError) || (${waitExpr})`, null, { timeout, polling: 250 }).catch((e) => errors.push('script wait: ' + e.message.split('\n')[0]));
      await page.waitForTimeout(400);
      // SwiftShader sometimes presents a fully black 3D frame (HUD intact); re-render until it does not
      let retries = await page.evaluate(BLACK_GUARD).catch(() => 'na');
      // early in a session the black can last a few seconds of wall time: wait and try again before giving up
      for (let round = 1; retries === -1 && round <= 8; round++) {
        await page.waitForTimeout(600);
        const r2 = await page.evaluate(BLACK_GUARD).catch(() => 'na');
        retries = r2 === -1 || r2 === 'na' ? r2 : `${round}x12+${r2}`;
      }
      if (retries !== 0 && retries !== 'na') black.push(`s${s}:${retries}`);
      // a starved SwiftShader can take a while to hand over a frame; one failed shot must not end the run
      await page.screenshot({ path: out.replace(/\.png$/, `-s${s}.png`), timeout: 180000 }).catch((e) => errors.push(`shot s${s}: ` + e.message.split('\n')[0]));
    }
    if (black.length) errors.push('black-frame retries ' + black.join(' '));
    const stats = await page.evaluate(() => (window.__reishi && window.__reishi.stats ? window.__reishi.stats() : null)).catch(() => null);
    console.log(JSON.stringify({ url: urls[i], out, ms: Date.now() - t0, stats, errors: errors.slice(0, 20) }));
    await page.close();
  }
} finally {
  await browser.close();
  if (proc) proc.kill();
}
process.exit(exitCode);
