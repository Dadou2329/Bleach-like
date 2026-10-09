// Compatibility check: load the game as a more limited browser/GPU would present itself — WebGL extensions hidden,
// limits lowered, a high-DPI screen — and report whether the title screen's 3D view still renders.
//
//   node tools/shots/compat.mjs --hide EXT_color_buffer_float,EXT_color_buffer_half_float [--limits MAX_TEXTURE_IMAGE_UNITS=16]
//        [--dpr 2] [--w 1280 --h 720] [--url "/?map=arena"] [--wait 20000] [--out shots/compat.png] [--port 5405]
//
// Hiding an extension only changes what the page is told (SwiftShader still has it), so this finds code that breaks
// when a capability is missing rather than GPU-side failures. Prints the console errors and whether the canvas is black.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import http from 'node:http';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => { if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]); return acc; }, []));
const PORT = Number(args.port ?? 5405);
const hide = args.hide ? String(args.hide).split(',') : [];
const limits = Object.fromEntries((args.limits ? String(args.limits).split(',') : []).map((kv) => { const [k, v] = kv.split('='); return [k, Number(v)]; }));
const ping = (u) => new Promise((r) => http.get(u, (x) => { x.resume(); r(true); }).on('error', () => r(false)));
let proc = null;
if (!(await ping(`http://127.0.0.1:${PORT}/`))) {
  proc = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', 'tools/shots/vite.shots.config.ts', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' });
  for (let i = 0; i < 120 && !(await ping(`http://127.0.0.1:${PORT}/`)); i++) await new Promise((r) => setTimeout(r, 500));
}
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: Number(args.w ?? 1280), height: Number(args.h ?? 720) }, deviceScaleFactor: Number(args.dpr ?? 1) });
await ctx.addInitScript(({ hide, limits, brokenWorkers }) => {
  for (const C of [WebGL2RenderingContext, WebGLRenderingContext]) {
    const ge = C.prototype.getExtension, gs = C.prototype.getSupportedExtensions, gp = C.prototype.getParameter;
    C.prototype.getExtension = function (n) { return hide.includes(n) ? null : ge.call(this, n); };
    C.prototype.getSupportedExtensions = function () { return (gs.call(this) || []).filter((n) => !hide.includes(n)); };
    C.prototype.getParameter = function (p) {
      for (const [k, v] of Object.entries(limits)) if (p === this[k]) return Math.min(v, gp.call(this, p));
      return gp.call(this, p);
    };
  }
  if (brokenWorkers) {
    // every worker fails to load (as a browser without module workers, or a crashing worker, would)
    const W = window.Worker;
    window.Worker = class extends W {
      constructor(url, opts) { super(URL.createObjectURL(new Blob(['throw new Error("worker test failure")'], { type: 'text/javascript' })), opts); }
    };
  }
}, { hide, limits, brokenWorkers: !!args.brokenworkers });
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !m.text().includes('[vite]')) logs.push(`${m.type()}: ${m.text().slice(0, 400)}`); });
page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message.slice(0, 400)));
const t0 = Date.now();
await page.goto(`http://127.0.0.1:${PORT}${args.url ?? '/?map=arena'}`, { timeout: 300000 });
let booted = true;
await page.waitForFunction('document.getElementById("start") || window.__pageErr', null, { timeout: 600000, polling: 500 }).catch(() => { booted = false; });
// sample the frame right after it is drawn (the drawing buffer is cleared once it is shown)
await page.waitForFunction('window.__reishi && window.__reishi.engine', null, { timeout: 600000, polling: 500 }).catch(() => {});
await page.evaluate(() => {
  const gr = window.__reishi?.engine?.gr;
  if (!gr) return;
  window.__px = { frames: 0, black: 0, last: null, errors: 0 };
  const orig = gr.render.bind(gr);
  gr.render = (dt) => {
    try { orig(dt); } catch (e) { window.__px.errors++; window.__px.err = String(e && e.stack || e).slice(0, 600); throw e; }
    const gl = gr.renderer.getContext(), px = new Uint8Array(4);
    let sum = 0;
    for (const [fx, fy] of [[0.5, 0.95], [0.5, 0.5], [0.2, 0.6], [0.8, 0.35], [0.35, 0.15], [0.9, 0.9], [0.1, 0.1]]) {
      gl.readPixels(Math.floor(gl.drawingBufferWidth * fx), Math.floor(gl.drawingBufferHeight * fy), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      sum += px[0] + px[1] + px[2];
    }
    window.__px.frames++;
    if (sum === 0) window.__px.black++;
    if (window.__px.lostAt !== undefined && sum > 0) window.__px.litAfterLoss = (window.__px.litAfterLoss ?? 0) + 1;
    window.__px.last = sum;
  };
});
if (args.breakpost || args.blackpost) {
  await page.evaluate((mode) => {
    const gr = window.__reishi.engine.gr;
    gr.composer.render = mode === 'throw' ? () => { throw new Error('post stack test failure'); } : () => {};
  }, args.breakpost ? 'throw' : 'black');
}
if (args.lose) {
  // a GPU reset in the middle of the first frames: lose the context, then give it back
  await page.waitForTimeout(Number(args.lose));
  await page.evaluate(() => {
    const gl = window.__reishi.engine.gr.renderer.getContext();
    const ext = gl.getExtension('WEBGL_lose_context');
    ext.loseContext();
    window.__px.lostAt = window.__px.frames;
    setTimeout(() => ext.restoreContext(), 1500);
  });
}
await page.waitForTimeout(Number(args.wait ?? 20000));
const st = await page.evaluate(() => {
  const r = window.__reishi;
  if (!r) return { api: false };
  const eng = r.engine;
  const d = document.getElementById('diag');
  return { api: true, frames: eng.frames, running: eng.running, pending: eng.pendingWork, lost: eng.gr.renderer.getContext().isContextLost(), px: window.__px, safe: eng.gr.safe, floatTargets: eng.gr.floatTargets, ao: !!eng.gr.ao, panel: d && d.style.display !== 'none' ? d.innerText.slice(0, 500) : null, report: window.__reishiReport ? window.__reishiReport().slice(0, 1200) : null };
}).catch((e) => ({ err: e.message }));
const black = st.px ? (st.px.frames === 0 ? 'NO FRAMES DRAWN' : st.px.black === st.px.frames ? 'BLACK' : `ok (${st.px.frames - st.px.black}/${st.px.frames} frames lit)`) : '?';
if (args.out) await page.screenshot({ path: String(args.out), timeout: 120000 }).catch(() => {});
console.log(JSON.stringify({ hide, limits, dpr: args.dpr ?? 1, booted, ms: Date.now() - t0, state: st, canvas: black, logs: logs.slice(0, 25) }, null, 1));
await browser.close();
if (proc) proc.kill();
