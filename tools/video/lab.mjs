// A persistent game page for directing films: load the town once, then run film jobs dropped into a folder.
//   node tools/video/lab.mjs --dir <jobs> [--w 640 --h 360] [--port 5403] [--url "/?..."]
// A job is <dir>/<name>.js (a film file); options on its first lines: // every: 6, // fast: 1, // fps: 24.
// Frames go to <dir>/<name>/f%05d.jpg, then <dir>/<name>.done (JSON: frames, ms, errors). <dir>/quit stops the lab.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => { if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]); return acc; }, []));
const PORT = Number(args.port ?? 5403), W = Number(args.w ?? 640), H = Number(args.h ?? 360);
const DIR = String(args.dir);
const URL0 = String(args.url ?? '/?char=ichigo&vs=grimmjow&hollows=0&q=low&autostart');
const runtime = fs.readFileSync(new URL('./film.js', import.meta.url), 'utf8');
const ping = (u) => new Promise((r) => http.get(u, (x) => { x.resume(); r(true); }).on('error', () => r(false)));
let proc = null;
if (!(await ping(`http://127.0.0.1:${PORT}/`))) {
  proc = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', 'tools/shots/vite.shots.config.ts', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' });
  for (let i = 0; i < 120 && !(await ping(`http://127.0.0.1:${PORT}/`)); i++) await new Promise((r) => setTimeout(r, 500));
}
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
let errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.text().startsWith('[film]') || m.text().includes('Rapier')) errors.push(m.text().slice(0, 300)); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
await page.goto(`http://127.0.0.1:${PORT}${URL0}`, { timeout: 300000 });
await page.waitForFunction('window.__reishi && window.__reishi.ready()', null, { timeout: 900000, polling: 500 });
await page.evaluate(runtime);
fs.writeFileSync(path.join(DIR, 'ready'), String(Date.now()));
console.log('lab ready');
for (;;) {
  if (fs.existsSync(path.join(DIR, 'quit'))) break;
  const jobs = fs.readdirSync(DIR).filter((f) => f.endsWith('.js') && !fs.existsSync(path.join(DIR, f.replace(/\.js$/, '.done'))));
  if (!jobs.length) { await new Promise((r) => setTimeout(r, 1000)); continue; }
  const job = jobs.sort()[0], name = job.replace(/\.js$/, '');
  const src = fs.readFileSync(path.join(DIR, job), 'utf8');
  const opt = (k, d) => { const m = new RegExp('//\\s*' + k + ':\\s*(\\S+)').exec(src); return m ? Number(m[1]) : d; };
  const every = opt('every', 6), fast = opt('fast', 1), fps = opt('fps', 24);
  const out = path.join(DIR, name);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  errors = [];
  const t0 = Date.now();
  let frames = 0;
  try {
    await page.evaluate(fs.readFileSync(new URL('./film.js', import.meta.url), 'utf8'));
    await page.evaluate(`(async () => { ${src}\n })()`);
    frames = await page.evaluate(`__film.init(${fps}, ${fast ? 'true' : 'false'})`);
    for (let f = 0; f < frames; f++) {
      const save = f % every === 0 || f === frames - 1;
      let st = await page.evaluate(`__film.frame(${f}, ${save})`);
      if (!save) continue;
      for (let k = 0; st.pending > 0 && k < 40; k++) { await page.waitForTimeout(40); st = await page.evaluate('__film.flush()'); }
      await page.screenshot({ path: path.join(out, `f${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 80, timeout: 240000 }).catch((e) => errors.push(`shot ${f}: ` + e.message.split('\n')[0]));
    }
  } catch (e) { errors.push('lab: ' + e.message.split('\n')[0]); }
  fs.writeFileSync(path.join(DIR, name + '.done'), JSON.stringify({ frames, ms: Date.now() - t0, errors: errors.slice(0, 30) }));
  console.log('done', name, Date.now() - t0);
}
await browser.close();
if (proc) proc.kill();
