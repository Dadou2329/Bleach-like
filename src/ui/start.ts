// Start overlay (title, controls, quality) and pause overlay when the pointer lock is released.

const CSS = `
#start { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: radial-gradient(ellipse at center, rgba(5,5,10,.35), rgba(5,5,10,.82)); font-family: 'Zen Kaku Gothic New', system-ui, sans-serif; color: #f3f1ec; z-index: 10; transition: opacity .5s; }
#start .box { width: min(780px, 94vw); max-height: 96vh; overflow-y: auto; text-align: center; pointer-events: auto; }
#start .kj { font-family: 'Yuji Syuku', serif; font-size: clamp(36px, 7vw, 72px); line-height: 1; color: #f3f1ec; text-shadow: 0 0 26px rgba(125,223,253,.55), 0 4px 0 #000; }
#start h1 { font-family: 'Dela Gothic One', sans-serif; font-size: clamp(26px, 5vw, 50px); letter-spacing: .35em; margin: 6px 0 2px; padding-left: .35em; text-shadow: 0 3px 0 #000; }
#start .sub { font-size: 14px; letter-spacing: .3em; opacity: .8; text-transform: uppercase; }
#start .play { margin: 20px auto 6px; display: inline-block; pointer-events: auto; cursor: pointer; font-family: 'Dela Gothic One', sans-serif; font-size: 22px; letter-spacing: .3em; padding: 14px 42px 14px 50px; color: #0b0b10; background: #f3f1ec; border: none; transform: skewX(-12deg); box-shadow: 0 0 0 2px #0b0b10, 0 0 0 4px #f3f1ec, 0 0 30px rgba(125,223,253,.45); }
#start .play:hover { background: #9fe6ff; }
#start .ctl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px 26px; text-align: left; font-size: 13px; background: rgba(8,8,12,.55); border: 1px solid rgba(255,255,255,.15); padding: 14px 20px; }
#start .ctl div { display: flex; gap: 10px; }
#start .ctl b { flex: 0 0 92px; color: #9fe6ff; font-weight: 700; }
@media (max-width: 560px) { #start .ctl { grid-template-columns: 1fr; } }
#start .opts { margin-top: 12px; font-size: 13px; opacity: .9; }
#start .opts a { color: #9fe6ff; margin: 0 6px; pointer-events: auto; }
#start .note { margin-top: 10px; font-size: 11px; opacity: .55; }
#start .sec { margin: 16px 0 6px; font-size: 11px; letter-spacing: .4em; opacity: .7; text-transform: uppercase; }
#start .cards { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
#start .card { pointer-events: auto; cursor: pointer; width: 118px; padding: 8px 6px 7px; background: rgba(8,8,12,.6); border: 1px solid rgba(255,255,255,.18); text-align: center; transition: transform .12s, border-color .12s; }
#start .card:hover { transform: translateY(-2px); }
#start .card.sel { border-color: var(--c); box-shadow: 0 0 0 1px var(--c), 0 0 18px color-mix(in srgb, var(--c) 45%, transparent); }
#start .card .ck { font-family: 'Yuji Syuku', serif; font-size: 30px; line-height: 1.05; color: var(--c); }
#start .card .cn { font-family: 'Dela Gothic One', sans-serif; font-size: 11px; letter-spacing: .06em; margin-top: 3px; }
#start .card .ct { font-size: 9px; opacity: .7; margin-top: 2px; }
#start .eras { display: none; gap: 6px; justify-content: center; flex-wrap: wrap; margin-top: 8px; }
#start .eras.on { display: flex; }
#start .era { pointer-events: auto; cursor: pointer; padding: 4px 11px; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; background: rgba(8,8,12,.6); border: 1px solid rgba(255,255,255,.2); color: #f3f1ec; }
#start .era.sel { background: var(--c); color: #0b0b10; border-color: var(--c); }
#start .modes { display: flex; gap: 8px; justify-content: center; }
#start .mode { pointer-events: auto; cursor: pointer; padding: 6px 16px; font-size: 12px; letter-spacing: .2em; text-transform: uppercase; background: rgba(8,8,12,.6); border: 1px solid rgba(255,255,255,.2); color: #f3f1ec; }
#start .mode.sel { background: #f3f1ec; color: #0b0b10; }
#start .vsrow { display: none; }
#start .vsrow.on { display: block; }
#start .ctl { margin-top: 14px; }
#pause { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; background: rgba(5,5,10,.5); color: #f3f1ec; font-family: 'Dela Gothic One', sans-serif; letter-spacing: .3em; font-size: 26px; z-index: 9; cursor: pointer; }
`;

export interface StartChoice {
  char: string;
  mode: 'waves' | 'duel';
  vs: string;
}

export interface StartFighter {
  id: string;
  name: string;
  kanji: string;
  title: string;
  color: string;
  /** era loadouts of one character share a group: one card, with a chip per era under the grid */
  group?: string;
  /** the era's chip label */
  era?: string;
  /** the card stands for this era of its group (the character's peak) */
  eraDefault?: boolean;
}

export function showStart(parent: HTMLElement, fighters: StartFighter[], init: StartChoice, onPlay: (c: StartChoice) => void, quality: 'high' | 'low'): void {
  const st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);
  const el = document.createElement('div');
  el.id = 'start';
  const other = quality === 'low' ? 'high' : 'low';
  const url = new URL(location.href);
  url.searchParams.set('q', other);
  // one card per character: an era group shows its default era's card
  const groupOf = (id: string) => fighters.find((f) => f.id === id)?.group;
  const lead = (g: string) => fighters.find((f) => f.group === g && f.eraDefault) ?? fighters.find((f) => f.group === g)!;
  const shown = fighters.filter((f) => !f.group || lead(f.group) === f);
  const cards = (kind: string) =>
    shown.map((f) => `<div class="card" data-kind="${kind}" data-id="${f.id}" data-group="${f.group ?? ''}" style="--c:${f.color}"><div class="ck">${f.kanji}</div><div class="cn">${f.name}</div><div class="ct">${f.title}</div></div>`).join('');
  const eras = (kind: string) => `<div class="eras" data-kind="${kind}"></div>`;
  el.innerHTML = `
    <div class="box">
      <div class="kj">霊子</div>
      <h1>REISHI</h1>
      <div class="sub">a Bleach voxel brawler · Karakura Town</div>
      <div class="sec">Fighter</div>
      <div class="cards">${cards('char')}</div>
      ${eras('char')}
      <div class="sec">Mode</div>
      <div class="modes"><button class="mode" data-mode="waves">Hollow waves</button><button class="mode" data-mode="duel">Duel</button></div>
      <div class="vsrow"><div class="sec">Opponent</div><div class="cards">${cards('vs')}</div>${eras('vs')}</div>
      <button class="play">PLAY</button>
      <div class="ctl">
        <div><b>WASD · Mouse</b><span>move · look</span></div>
        <div><b>LMB</b><span>light chain</span></div>
        <div><b>Space</b><span>jump · air-step · hold to stand on reishi</span></div>
        <div><b>RMB</b><span>heavy</span></div>
        <div><b>Shift</b><span>Shunpo / Sonído · hold to flash-run</span></div>
        <div><b>Q · E · R</b><span>specials</span></div>
        <div><b>Ctrl / C</b><span>descend</span></div>
        <div><b>F</b><span>release (Bankai, Resurrección…)</span></div>
        <div><b>Tab / MMB</b><span>lock-on</span></div>
        <div><b>G</b><span>state (Hollow mask…)</span></div>
        <div><b>H · Esc</b><span>controls · pause</span></div>
        <div><b>V</b><span>reiatsu flare</span></div>
      </div>
      <div class="opts">Graphics: <b>${quality}</b> · <a href="${url.toString()}">switch to ${other}</a></div>
      <div class="note">Everything is destructible. Hollows come in waves; every third wave the sky tears open.</div>
    </div>`;
  parent.appendChild(el);
  const choice: StartChoice = { ...init };
  const refresh = () => {
    el.querySelectorAll<HTMLElement>('.card').forEach((c) => {
      const kind = c.dataset.kind as 'char' | 'vs';
      const g = c.dataset.group;
      c.classList.toggle('sel', choice[kind] === c.dataset.id || (!!g && groupOf(choice[kind]) === g));
      // a grouped card wears the era chosen in its group (else its peak era)
      if (g) {
        const f = (groupOf(choice[kind]) === g ? fighters.find((x) => x.id === choice[kind]) : undefined) ?? lead(g);
        c.style.setProperty('--c', f.color);
        (c.querySelector('.ck') as HTMLElement).textContent = f.kanji;
        (c.querySelector('.cn') as HTMLElement).textContent = f.name;
        (c.querySelector('.ct') as HTMLElement).textContent = f.title;
      }
    });
    // the era chips of the selected character
    el.querySelectorAll<HTMLElement>('.eras').forEach((row) => {
      const kind = row.dataset.kind as 'char' | 'vs';
      const g = groupOf(choice[kind]);
      row.classList.toggle('on', !!g);
      if (!g) return;
      const list = fighters.filter((f) => f.group === g);
      row.innerHTML = list.map((f) => `<button class="era${f.id === choice[kind] ? ' sel' : ''}" data-id="${f.id}" style="--c:${f.color}">${f.era ?? f.name}</button>`).join('');
      row.querySelectorAll<HTMLElement>('.era').forEach((b) =>
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          choice[kind] = b.dataset.id!;
          refresh();
        }),
      );
    });
    el.querySelectorAll<HTMLElement>('.mode').forEach((m) => m.classList.toggle('sel', m.dataset.mode === choice.mode));
    (el.querySelector('.vsrow') as HTMLElement).classList.toggle('on', choice.mode === 'duel');
  };
  el.querySelectorAll<HTMLElement>('.card').forEach((c) =>
    c.addEventListener('click', (e) => {
      e.stopPropagation();
      const kind = c.dataset.kind as 'char' | 'vs';
      // a grouped card keeps the era already chosen in its group
      const g = c.dataset.group;
      if (!g || groupOf(choice[kind]) !== g) choice[kind] = c.dataset.id!;
      refresh();
    }),
  );
  el.querySelectorAll<HTMLElement>('.mode').forEach((m) =>
    m.addEventListener('click', (e) => {
      e.stopPropagation();
      choice.mode = m.dataset.mode as 'waves' | 'duel';
      refresh();
    }),
  );
  refresh();
  const btn = el.querySelector('.play') as HTMLButtonElement;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 500);
    onPlay(choice);
  });
}

export function pauseOverlay(parent: HTMLElement, onResume: () => void): { show: (on: boolean) => void } {
  const el = document.createElement('div');
  el.id = 'pause';
  el.textContent = 'PAUSED — CLICK TO RESUME';
  parent.appendChild(el);
  el.addEventListener('click', () => onResume());
  return { show: (on) => { el.style.display = on ? 'flex' : 'none'; } };
}
