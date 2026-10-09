// Start overlay (title, controls, quality) and pause overlay when the pointer lock is released.
import { SPECIAL_WIKI, openWiki } from './wiki';

const CSS = `
#start { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: radial-gradient(ellipse at center, rgba(5,5,10,.35), rgba(5,5,10,.82)); font-family: 'Zen Kaku Gothic New', system-ui, sans-serif; color: #f3f1ec; z-index: 10; transition: opacity .5s; }
#start .box { width: min(780px, 94vw); max-height: 96vh; overflow-y: auto; text-align: center; pointer-events: auto; }
#start h1 { margin: 0; line-height: 0; }
#start .logo { width: 100%; height: auto; display: block; overflow: visible; filter: drop-shadow(0 6px 0 rgba(0,0,0,.55)); }
#start .logo .w { font-family: 'Dela Gothic One', sans-serif; font-size: 92px; paint-order: stroke; stroke: #0b0b10; stroke-width: 7px; stroke-linejoin: round; }
#start .logo .kj { font-family: 'Yuji Syuku', serif; font-size: 210px; fill: rgba(125,223,253,.09); }
#start .logo .kjs { font-family: 'Yuji Syuku', serif; font-size: 30px; fill: #cfefff; letter-spacing: .5em; }
#start .logo .cut { animation: lgcut 3.2s ease-in-out infinite; }
@keyframes lgcut { 0%, 100% { opacity: .75; } 50% { opacity: 1; } }
#start .sub { font-size: 14px; letter-spacing: .3em; opacity: .8; text-transform: uppercase; }
#start .play { margin: 20px auto 6px; display: inline-block; pointer-events: auto; cursor: pointer; font-family: 'Dela Gothic One', sans-serif; font-size: 22px; letter-spacing: .3em; padding: 14px 42px 14px 50px; color: #0b0b10; background: #f3f1ec; border: none; transform: skewX(-12deg); box-shadow: 0 0 0 2px #0b0b10, 0 0 0 4px #f3f1ec, 0 0 30px rgba(125,223,253,.45); }
#start .play:hover { background: #9fe6ff; }
#start .play { position: sticky; bottom: 12px; z-index: 2; }
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
#start .vsrow, #start .sbrow, #start .netrow { display: none; }
#start .vsrow.on, #start .sbrow.on, #start .netrow.on { display: block; }
#start .hint { font-size: 12px; opacity: .8; margin: 6px auto 0; max-width: 560px; line-height: 1.45; }
#start .toggle { pointer-events: auto; cursor: pointer; margin-top: 8px; padding: 5px 14px; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; background: rgba(8,8,12,.6); border: 1px solid rgba(255,255,255,.25); color: #f3f1ec; }
#start .toggle.on { background: #9fe6ff; color: #0b0b10; border-color: #9fe6ff; }
#start .lobby { display: flex; gap: 8px; justify-content: center; align-items: center; flex-wrap: wrap; margin-top: 8px; }
#start .lobby button { pointer-events: auto; cursor: pointer; padding: 6px 14px; font-size: 12px; letter-spacing: .16em; text-transform: uppercase; background: rgba(8,8,12,.6); border: 1px solid rgba(255,255,255,.3); color: #f3f1ec; }
#start .lobby button:hover { border-color: #9fe6ff; }
#start .lobby input { pointer-events: auto; width: 110px; padding: 6px 8px; font-size: 16px; letter-spacing: .3em; text-transform: uppercase; text-align: center; background: rgba(8,8,12,.7); border: 1px solid rgba(255,255,255,.3); color: #f3f1ec; font-family: 'Dela Gothic One', sans-serif; }
#start .code { font-family: 'Dela Gothic One', sans-serif; font-size: 28px; letter-spacing: .35em; color: #9fe6ff; margin-top: 8px; user-select: all; }
#start .status { font-size: 12px; margin-top: 6px; min-height: 16px; opacity: .9; }
#start .play:disabled { opacity: .45; cursor: default; background: #f3f1ec; }
#start .wikibtn { pointer-events: auto; cursor: pointer; margin-top: 12px; padding: 7px 18px; font-family: 'Dela Gothic One', sans-serif; font-size: 12px; letter-spacing: .22em; text-transform: uppercase; color: #ffd27a; background: rgba(255,210,122,.08); border: 1px solid rgba(255,210,122,.6); box-shadow: 0 0 14px rgba(255,210,122,.18); }
#start .wikibtn:hover { background: #ffd27a; color: #141418; }
#start .card.special { background: linear-gradient(160deg, rgba(40,34,60,.85), rgba(14,16,34,.85)); border-color: rgba(255,210,122,.55); position: relative; }
#start .card.special::after { content: '✦'; position: absolute; top: 3px; right: 6px; font-size: 11px; color: #ffd27a; }
#start .ctl { margin-top: 14px; }
#pause { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; background: rgba(5,5,10,.5); color: #f3f1ec; font-family: 'Dela Gothic One', sans-serif; letter-spacing: .3em; font-size: 26px; z-index: 9; cursor: pointer; }
`;

/**
 * The title: "BLEACH : REISHI". White-silver BLEACH and reiatsu-blue REISHI, the colon two glowing diamonds, the whole
 * lockup sliced by one diagonal sword cut — the upper half slid along the cut, a line of light through it — with 霊子
 * (reishi, spirit particles) in faint calligraphy behind and small under it.
 */
export const LOGO = `<svg class="logo" viewBox="0 0 1000 250" role="img" aria-label="Bleach : Reishi">
  <defs>
    <linearGradient id="lg-w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#eef2f7"/><stop offset=".52" stop-color="#c9d2de"/><stop offset="1" stop-color="#8f9bad"/></linearGradient>
    <linearGradient id="lg-c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1fcff"/><stop offset=".45" stop-color="#8fe4fd"/><stop offset=".55" stop-color="#5cc4f2"/><stop offset="1" stop-color="#2d74d0"/></linearGradient>
    <linearGradient id="lg-blade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9fe6ff" stop-opacity="0"/><stop offset=".18" stop-color="#e8fbff"/><stop offset=".82" stop-color="#e8fbff"/><stop offset="1" stop-color="#9fe6ff" stop-opacity="0"/></linearGradient>
    <filter id="lg-glow" x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="lg-blue" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur in="SourceAlpha" stdDeviation="8" result="b"/><feFlood flood-color="#5cc4f2" flood-opacity=".6"/><feComposite in2="b" operator="in" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="lg-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <clipPath id="lg-top"><polygon points="-40,-40 1040,-40 1040,74 -40,182"/></clipPath>
    <clipPath id="lg-bot"><polygon points="-40,182 1040,74 1040,290 -40,290"/></clipPath>
    <g id="lg-words">
      <text class="w" x="14" y="150" textLength="440" lengthAdjust="spacingAndGlyphs" fill="url(#lg-w)">BLEACH</text>
      <g filter="url(#lg-soft)" fill="url(#lg-c)" stroke="#0b0b10" stroke-width="3">
        <rect x="491" y="78" width="18" height="18" transform="rotate(45 500 87)"/>
        <rect x="491" y="122" width="18" height="18" transform="rotate(45 500 131)"/>
      </g>
      <text class="w" x="546" y="150" textLength="440" lengthAdjust="spacingAndGlyphs" fill="url(#lg-c)" filter="url(#lg-blue)">REISHI</text>
    </g>
  </defs>
  <text class="kj" x="500" y="205" text-anchor="middle">霊子</text>
  <g clip-path="url(#lg-bot)"><use href="#lg-words"/></g>
  <g clip-path="url(#lg-top)"><use href="#lg-words" transform="translate(13 -1.3)"/></g>
  <g class="cut" filter="url(#lg-glow)"><line x1="-10" y1="179" x2="1010" y2="77" stroke="url(#lg-blade)" stroke-width="3.2" stroke-linecap="round"/></g>
  <line x1="300" y1="214" x2="420" y2="214" stroke="#9fe6ff" stroke-opacity=".55" stroke-width="1.5"/>
  <line x1="580" y1="214" x2="700" y2="214" stroke="#9fe6ff" stroke-opacity=".55" stroke-width="1.5"/>
  <text class="kjs" x="507" y="225" text-anchor="middle">霊子</text>
</svg>`;

export interface StartChoice {
  char: string;
  /** Vs AI, Sandbox (free roam, no limits), Vs Player 2 (online lobby) */
  mode: 'duel' | 'sandbox' | 'online';
  vs: string;
  /** Sandbox: Hollows come in waves */
  hollows: boolean;
}

/** The lobby, provided by the game: the start screen only shows it. */
export interface StartNet {
  /** open a lobby; returns its code. `status(text, ready)`: ready once player 2 is in (PLAY starts the fight) */
  host(status: (text: string, ready: boolean) => void): string;
  /** dial a lobby by its code */
  join(code: string, status: (text: string, ready: boolean) => void): void;
  /** my fighter changed: tell the other side */
  pick(char: string): void;
  /** opened from a ?join=CODE link: fill in the code and dial at once */
  autoJoin?: string;
}

export interface StartScreen {
  /** take the screen down (the guest's fight starts when the host says so) */
  close(): void;
  /** the choice as it stands */
  readonly choice: StartChoice;
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
  /** an original character (a gold card; explained in the Special characters wiki) */
  special?: boolean;
}

export function showStart(parent: HTMLElement, fighters: StartFighter[], init: StartChoice, onPlay: (c: StartChoice) => void, quality: 'high' | 'low', net?: StartNet, map?: { name: string; other: string; href: string }): StartScreen {
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
    shown.map((f) => `<div class="card${f.special ? ' special' : ''}" data-kind="${kind}" data-id="${f.id}" data-group="${f.group ?? ''}" style="--c:${f.color}"><div class="ck">${f.kanji}</div><div class="cn">${f.name}</div><div class="ct">${f.title}</div></div>`).join('');
  const eras = (kind: string) => `<div class="eras" data-kind="${kind}"></div>`;
  el.innerHTML = `
    <div class="box">
      <h1>${LOGO}</h1>
      <div class="sub">a voxel brawler · Karakura Town</div>
      <button class="wikibtn">✦ Special characters wiki</button>
      <div class="sec">Mode</div>
      <div class="modes"><button class="mode" data-mode="duel">Vs AI</button><button class="mode" data-mode="sandbox">Sandbox</button><button class="mode" data-mode="online">Vs Player 2</button></div>
      <div class="sbrow"><div class="hint">Walk the city and use everything, without limits: reiatsu never runs out, no cooldowns, no lockouts, forms never time out, and you cannot die. <b>N</b> calls a training opponent, <b>Backspace</b> rebuilds the town.</div><button class="toggle hollows">Hollow waves: off</button></div>
      <div class="netrow"><div class="hint">Fight another player who has the game. One of you creates a lobby and shares its code; the other joins with it. Each picks a fighter above; the host starts the fight.</div>
        <div class="lobby"><button class="host">Create lobby</button><span style="opacity:.6">or</span><input class="joincode" maxlength="5" placeholder="CODE"><button class="join">Join</button></div>
        <div class="code"></div><div class="status"></div></div>
      <div class="sec">Fighter</div>
      <div class="cards">${cards('char')}</div>
      ${eras('char')}
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
      <div class="opts">Graphics: <b>${quality}</b> · <a href="${url.toString()}">switch to ${other}</a>${map ? ` · Map: <b>${map.name}</b> · <a href="${map.href}">switch to ${map.other}</a>` : ''}</div>
      <div class="note">Everything is destructible — the ground goes 32 m deep.</div>
    </div>`;
  parent.appendChild(el);
  const choice: StartChoice = { ...init };
  let netReady = false;
  let netRole: 'host' | 'guest' | null = null;
  let lastPick = '';
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
    (el.querySelector('.sbrow') as HTMLElement).classList.toggle('on', choice.mode === 'sandbox');
    (el.querySelector('.netrow') as HTMLElement).classList.toggle('on', choice.mode === 'online');
    const hb = el.querySelector('.hollows') as HTMLElement;
    hb.classList.toggle('on', choice.hollows);
    hb.textContent = `Hollow waves: ${choice.hollows ? 'on' : 'off'}`;
    const play = el.querySelector('.play') as HTMLButtonElement;
    play.disabled = choice.mode === 'online' && !netReady;
    play.textContent = choice.mode === 'online' ? (netRole === 'guest' ? 'WAITING FOR HOST' : 'START') : 'PLAY';
    if (net && choice.char !== lastPick) {
      lastPick = choice.char;
      net.pick(choice.char);
    }
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
      choice.mode = m.dataset.mode as StartChoice['mode'];
      refresh();
    }),
  );
  el.querySelector('.wikibtn')!.addEventListener('click', (e) => {
    e.stopPropagation();
    openWiki(el, SPECIAL_WIKI.filter((w) => fighters.some((f) => f.id === w.id)), (id) => {
      choice.char = id;
      refresh();
    });
  });
  el.querySelector('.hollows')!.addEventListener('click', (e) => {
    e.stopPropagation();
    choice.hollows = !choice.hollows;
    refresh();
  });
  // the lobby
  const statusEl = el.querySelector('.status') as HTMLElement;
  const codeEl = el.querySelector('.code') as HTMLElement;
  const input = el.querySelector('.joincode') as HTMLInputElement;
  const status = (text: string, ready: boolean) => {
    statusEl.textContent = text;
    netReady = ready;
    refresh();
  };
  input.addEventListener('keydown', (e) => e.stopPropagation());
  el.querySelector('.host')!.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!net || netRole) return;
    netRole = 'host';
    codeEl.textContent = net.host(status);
    refresh();
  });
  const join = () => {
    if (!net || netRole) return;
    const code = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length !== 5) {
      statusEl.textContent = 'A lobby code has five letters';
      return;
    }
    netRole = 'guest';
    codeEl.textContent = code;
    net.join(code, status);
    refresh();
  };
  el.querySelector('.join')!.addEventListener('click', (e) => {
    e.stopPropagation();
    join();
  });
  if (net?.autoJoin) {
    choice.mode = 'online';
    input.value = net.autoJoin;
    join();
  }
  refresh();
  const close = () => {
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';
    setTimeout(() => el.remove(), 500);
  };
  const btn = el.querySelector('.play') as HTMLButtonElement;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (btn.disabled) return;
    close();
    onPlay(choice);
  });
  return { close, choice };
}

export function pauseOverlay(parent: HTMLElement, onResume: () => void): { show: (on: boolean) => void } {
  const el = document.createElement('div');
  el.id = 'pause';
  el.textContent = 'PAUSED — CLICK TO RESUME';
  parent.appendChild(el);
  el.addEventListener('click', () => onResume());
  return { show: (on) => { el.style.display = on ? 'flex' : 'none'; } };
}
