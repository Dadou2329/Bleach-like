// Run JS inside the game page (headless) and print the result. For debugging sim state.
//   node tools/shots/probe.mjs --url "/?q=low" --eval "JSON.stringify(window.__reishi.stats())"
//   node tools/shots/probe.mjs --url "/" --file path/to/script.js   (script body is evaluated; its value is printed)
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return acc;
  }, []),
);
const PORT = Number(args.port ?? 5201);
const ping = (u) => new Promise((r) => http.get(u, (x) => { x.resume(); r(true); }).on('error', () => r(false)));
let proc = null;
if (!(await ping(`http://127.0.0.1:${PORT}/`))) {
  proc = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', 'tools/shots/vite.shots.config.ts', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' });
  for (let i = 0; i < 120 && !(await ping(`http://127.0.0.1:${PORT}/`)); i++) await new Promise((r) => setTimeout(r, 500));
}
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const p = await b.newPage({ viewport: { width: Number(args.w ?? 640), height: Number(args.h ?? 360) } });
  p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  p.on('console', (m) => { if (args.console) console.log('console:', m.text()); });
  await p.goto(`http://127.0.0.1:${PORT}${args.url ?? '/'}`);
  await p.waitForFunction(String(args.wait ?? 'window.__reishi && window.__reishi.ready()'), null, { timeout: Number(args.timeout ?? 180000) });
  const code = args.file ? fs.readFileSync(String(args.file), 'utf8') : String(args.eval ?? 'JSON.stringify(window.__reishi.stats())');
  const res = await p.evaluate(code);
  console.log(typeof res === 'string' ? res : JSON.stringify(res));
  if (args.shot) await p.screenshot({ path: String(args.shot), timeout: 180000 }).catch((e) => console.log('screenshot failed:', e.message.split('\n')[0]));
} finally {
  await b.close();
  if (proc) proc.kill();
}
