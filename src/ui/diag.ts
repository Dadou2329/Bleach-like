// The graphics problems panel: hidden while all is well. When the 3D view fails on this machine it says what happened,
// in plain words, with buttons to copy a report, to try simple graphics or the low settings, and to close it.
import { onProblem, problems, type GpuInfo, type Problem } from '../render/problems';

const CSS = `
#diag { position: fixed; left: 14px; bottom: 14px; z-index: 60; max-width: min(560px, calc(100vw - 28px)); display: none;
  font-family: 'Zen Kaku Gothic New', system-ui, sans-serif; font-size: 13px; color: #f3f1ec; background: rgba(12,10,16,.94);
  border: 1px solid rgba(255,120,120,.55); box-shadow: 0 6px 24px rgba(0,0,0,.6); padding: 12px 14px 10px; pointer-events: auto; }
#diag.warn { border-color: rgba(255,210,122,.55); }
#diag h3 { margin: 0 0 6px; font-size: 14px; letter-spacing: .06em; }
#diag ul { margin: 0 0 8px 16px; padding: 0; }
#diag li { margin: 3px 0; line-height: 1.35; }
#diag li small { display: block; opacity: .7; white-space: pre-wrap; word-break: break-word; max-height: 4.2em; overflow: hidden; }
#diag .gpu { opacity: .65; font-size: 11px; margin-bottom: 8px; word-break: break-word; }
#diag button { cursor: pointer; margin: 0 6px 4px 0; padding: 5px 11px; font-size: 12px; color: #f3f1ec; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.3); }
#diag button:hover { border-color: #9fe6ff; }
`;

export function installDiagnostics(parent: HTMLElement, info: () => GpuInfo | null): void {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const el = document.createElement('div');
  el.id = 'diag';
  parent.appendChild(el);
  let closed = false;

  const reload = (set: Record<string, string | null>) => {
    const u = new URL(location.href);
    for (const [k, v] of Object.entries(set)) {
      if (v === null) u.searchParams.delete(k);
      else u.searchParams.set(k, v);
    }
    location.href = u.toString();
  };
  const report = (): string => {
    const g = info();
    const lines = [
      `Bleach : Reishi graphics report — ${new Date().toISOString()}`,
      `browser: ${navigator.userAgent}`,
      g ? `GPU: ${g.renderer} (${g.vendor}) · ${g.webgl} · max texture ${g.maxTexture} · half-float targets ${g.floatTargets ? 'yes' : 'NO'} · pixel ratio ${g.pixelRatio} · canvas ${g.canvas}` : 'GPU: (no WebGL2 context)',
      `page: ${location.search || '(no options)'}`,
      ...problems().map((p) => `- [${p.level}${p.resolved ? ', resolved' : ''}] ${p.title}${p.detail ? `\n    ${p.detail.replace(/\n/g, '\n    ')}` : ''}`),
    ];
    return lines.join('\n');
  };
  const render = () => {
    const list = problems().filter((p) => p.level !== 'info' && !p.resolved);
    if (closed || list.length === 0) {
      el.style.display = 'none';
      return;
    }
    const bad = list.some((p) => p.level === 'error');
    el.className = bad ? '' : 'warn';
    const g = info();
    el.innerHTML = `<h3>${bad ? '⚠ The 3D view has a problem on this machine' : '⚠ Graphics notice'}</h3>
      <ul>${list.map((p: Problem) => `<li>${esc(p.title)}${p.detail ? `<small>${esc(p.detail)}</small>` : ''}</li>`).join('')}</ul>
      <div class="gpu">${g ? esc(`${g.renderer} · ${g.webgl}`) : 'no WebGL2 context'}</div>
      <button data-a="copy">Copy report</button><button data-a="safe">Simple graphics</button><button data-a="low">Low quality</button><button data-a="close">Close</button>`;
    el.style.display = 'block';
  };
  el.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).dataset?.a;
    if (a === 'copy') {
      const text = report();
      navigator.clipboard?.writeText(text).then(
        () => ((e.target as HTMLElement).textContent = 'Copied!'),
        () => window.prompt('Copy this report:', text),
      );
      if (!navigator.clipboard) window.prompt('Copy this report:', text);
    } else if (a === 'safe') reload({ safe: '1' });
    else if (a === 'low') reload({ q: 'low' });
    else if (a === 'close') {
      closed = true;
      render();
    }
    e.stopPropagation();
  });
  onProblem(() => render());
  (window as unknown as { __reishiReport: () => string }).__reishiReport = report;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}
