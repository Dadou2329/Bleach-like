// The start screen's "Special characters wiki": a page per original character (outside the manga) explaining the
// Zanpakutō, every release and form, every power and the keys for them. Data first (SPECIAL_WIKI), then the overlay.

export interface WikiMove {
  key: string;
  name: string;
  kanji?: string;
  /** the name's meaning */
  means?: string;
  text: string;
}

export interface WikiForm {
  name: string;
  kanji: string;
  /** the release command and its meaning */
  command?: string;
  means?: string;
  look: string;
  /** what the form changes (numbers) */
  stats: string[];
  moves: WikiMove[];
}

export interface WikiEntry {
  id: string;
  name: string;
  kanji: string;
  title: string;
  color: string;
  dedication: string;
  lore: string[];
  profile: [string, string][];
  zanpakuto: { name: string; kanji: string; means: string; text: string[] };
  forms: WikiForm[];
  passives: WikiMove[];
  numbers: { label: string; values: string[] }[];
  tips: string[];
}

export const SPECIAL_WIKI: WikiEntry[] = [
  {
    id: 'natacha',
    name: 'Natacha',
    kanji: '明星',
    title: 'Hoshiyomi — the Star Reader of the Royal Guard',
    color: '#ffd27a',
    dedication: 'Natacha is a special character: an original, added to REISHI as a tribute to someone very important to its author. Her look comes from her — the copper hair, the freckles, the warm smile — and her powers were written for her. She is the strongest fighter in the game, on purpose.',
    lore: [
      'Natacha is the Hoshiyomi, the Star Reader, of the Royal Guard. In the Soul King\'s palace they say her freckles are stars that fell on her face the night her Zanpakutō first spoke to her — and when Myōjō shines, they shine with it.',
      'She fights smiling. She reads her opponent\'s next move in the sky before they make it, answers every blow from behind, and when she calls her Bankai the day itself gives way to her night: meteors fall, the constellations come down to fight beside her, and the Milky Way pours out of her blade.',
      'Past the Bankai lies Myōjō Kōrin, the descent of the morning star: she becomes the last star before sunrise, and her final technique is the dawn itself.',
    ],
    profile: [
      ['Race', 'Shinigami'],
      ['Affiliation', 'Royal Guard (Squad Zero)'],
      ['Title', 'Hoshiyomi 星読み — the Star Reader'],
      ['Height', '165 cm'],
      ['Hair', 'copper auburn, a low twisted bun with a gold star pin (worn down in the Bankai)'],
      ['Eyes', 'dark brown (gold in her final form)'],
      ['Marks', 'freckles across the nose and the cheeks — they glow gold once Myōjō is released'],
      ['Jewellery', 'a thin gold necklace with three small stones: her three seals'],
      ['Outfit', 'black shihakushō, a white long-sleeved haori with a navy night-sky hem sown with gold stars, an eight-pointed star in a rhombus on the back, a navy obi with a gold cord'],
    ],
    zanpakuto: {
      name: 'Myōjō',
      kanji: '明星',
      means: '"the Morning Star" — Venus, the brightest star, the one still shining at dawn',
      text: [
        'Sealed, Myōjō is an elegant katana with a gold eight-pointed star for a guard, a wine-red hilt wrapped over pale ray skin, and a navy lacquered sheath sown with gold flecks.',
        'Its power is the sky. Released, it reads the stars and calls them down: it marks enemies with stars and joins them into constellations that cut, rains stars and meteors, throws its own light as a beam — and in the Bankai it brings the whole night down over the battlefield.',
      ],
    },
    forms: [
      {
        name: 'Sealed — Myōjō',
        kanji: '封印',
        look: 'The katana with the star guard; the sheath at her left hip. The necklace\'s three stones are dark.',
        stats: ['Power ×1.6', 'Damage taken ×0.8', 'Shunpo 26 m'],
        moves: [
          { key: 'LMB', name: 'Iai string', kanji: '居合', text: 'Five cuts: a thrust, two diagonal cuts, a turning level cut and a rising cut that launches.' },
          { key: 'RMB', name: 'Ryūsei', kanji: '流星', means: 'Shooting Star', text: 'An iai flash up to 26 m straight through the target. Everyone on the line is cut (it cannot be blocked) and everything on it — walls, whole buildings — is cut level at her waist.' },
          { key: 'Q', name: 'Hoshi-tsubute', kanji: '星礫', means: 'Star Pebbles', text: 'Five stars from her left palm. They hang a moment, then home in and burst.' },
          { key: 'E', name: 'Tenmaku', kanji: '天幕', means: 'Sky Curtain', text: 'A dome of starlight for about 3 seconds: no damage gets in, enemy shots that touch it are undone, enemies inside are thrown out.' },
          { key: 'R', name: 'Hoshiyomi', kanji: '星読み', means: 'Star Reading', text: 'For 6 seconds she reads every blow before it lands: instead of taking it she appears behind the attacker and cuts them.' },
          { key: 'G', name: 'Bakudō #61 — Rikujōkōrō', kanji: '六杖光牢', text: 'Six rods of light pin the target in place for 3 seconds.' },
          { key: 'F', name: 'Kagayake, Myōjō', kanji: '輝け', text: 'Releases the Shikai.' },
        ],
      },
      {
        name: 'Shikai — Myōjō',
        kanji: '始解',
        command: 'Kagayake, Myōjō — 輝け「明星」',
        means: 'Shine, Morning Star',
        look: 'The blade straightens into pale gold steel with a glowing fuller; the guard becomes a larger star inside a ring. Her freckles glint gold. The first stone of the necklace lights.',
        stats: ['Power ×2.4', 'Damage taken ×0.65', 'Reiatsu +2/s'],
        moves: [
          { key: 'LMB', name: 'Star Marks', kanji: '星印', text: 'The same five cuts; every cut that lands sets a Star Mark on the enemy (up to 7 each — small stars circling them). The fifth cut throws a gold crescent.' },
          { key: 'RMB', name: 'Seiza-giri', kanji: '星座斬り', means: 'Constellation Cut', text: 'The marks are joined into a constellation: lines of light run from the blade\'s point through every marked enemy, each mark bursts (60 per mark, unblockable) and the lines cut whatever stands between them. Without marks it throws a gold crescent.' },
          { key: 'Q', name: 'Hoshi no Ame', kanji: '星の雨', means: 'Star Rain', text: 'Twenty-four stars rain down on a 6 m circle around the target; a third of them home in on the target itself.' },
          { key: 'E', name: 'Myōjō-kō', kanji: '明星光', means: 'Light of the Morning Star', text: 'A gold beam from the blade\'s point that bores straight through 90 m of anything.' },
          { key: 'R', name: 'Hoshi-utsuri', kanji: '星移り', means: 'Star Shift', text: 'She is suddenly behind the target — or behind the marked enemy furthest away — and cuts (unblockable), leaving a new mark.' },
          { key: 'G', name: 'Kasei', kanji: '禍星', means: 'Calamity Star', text: 'A star forms over the target and swells, dragging everyone within 18 m into it, then explodes.' },
          { key: 'F', name: 'Bankai', kanji: '卍解', text: 'Releases the Bankai.' },
        ],
      },
      {
        name: 'Bankai — Ginga Myōjō: Hoshifuru Yoru',
        kanji: '銀河明星・星降る夜',
        command: 'Bankai — 卍解「銀河明星・星降る夜」',
        means: 'Galaxy Morning Star: the Night the Stars Fall',
        look: 'Night falls over the whole map: a sky full of stars, the Milky Way across it, shooting stars, and the morning star burning low on the horizon. Her haori turns into a midnight mantle sown with glowing stars, her hair falls loose in long copper waves, and the blade becomes a length of the night sky with a gold edge. Two stones light.',
        stats: ['Power ×3.4', 'Damage taken ×0.5', 'Healed to full on release', 'Regenerates 1.5 % HP and 8 reiatsu per second', 'Knockback ×0.4'],
        moves: [
          { key: 'LMB', name: 'Star crescents', kanji: '銀河', text: 'Every cut of the long star blade throws a thin crescent of starlight.' },
          { key: 'RMB', name: 'Ryūseigun', kanji: '流星群', means: 'Meteor Shower', text: 'Twelve stars fall out of the night on the target\'s area, half of them following the target down, each one leaving a crater.' },
          { key: 'Q', name: 'Seiza Shōkan', kanji: '星座召喚', means: 'Constellation Summoning', text: 'A giant constellation is drawn up in the sky behind the target; each press calls the next one. Orion swings a sword of light down through the target and splits the city behind it in two. Sagittarius looses nine arrows of light. Scorpius\' stinger dives in and paralyses.' },
          { key: 'E', name: 'Amanogawa', kanji: '天の川', means: 'River of Heaven (the Milky Way)', text: 'The Milky Way poured out of the blade: a wide beam full of stars, 120 m long.' },
          { key: 'R', name: 'Kuro-boshi', kanji: '黒星', means: 'Black Star', text: 'A collapsing star over the target: it drags everyone in, drains whoever touches it, swallows enemy shots and the ground around it, then bursts.' },
          { key: 'G', name: 'Hoshiyomi: Tenmon', kanji: '星読み・天文', means: 'Star Reading: Astronomy', text: 'Eight seconds of foresight; every counter strikes three times as hard.' },
          { key: 'F', name: 'Myōjō Kōrin', kanji: '明星降臨', text: 'Releases her final form.' },
        ],
      },
      {
        name: 'Final form — Myōjō Kōrin',
        kanji: '明星降臨',
        command: 'Kōrin — 降臨「明けの明星」',
        means: 'Descent of the Morning Star',
        look: 'A pillar of light pours down on her and she rises into it. The night turns to the hour before dawn. Her hair becomes copper-gold light, her eyes turn gold, her robe white and gold, an eight-pointed halo of light hangs behind her head, and the blade is pure light. All three stones are lit.',
        stats: ['Power ×5', 'Damage taken ×0.2 (and less again from reiatsu attacks)', 'Healed to full on release', 'Regenerates 3 % HP and 20 reiatsu per second', 'Flies: Space climbs, Ctrl sinks', 'Never knocked back; immune to every status (slows, seals, binds, time fields, blindness, poisons, weights…)'],
        moves: [
          { key: 'LMB', name: 'Light', kanji: '光', text: 'Six cuts of light, each throwing a large crescent of dawn light 40 m ahead.' },
          { key: 'RMB', name: 'Chōshinsei', kanji: '超新星', means: 'Supernova', text: 'A star pressed small between her hands and detonated on the target: a 9 m blast that cannot be blocked.' },
          { key: 'Q', name: 'Seigun Ranbu', kanji: '星群乱舞', means: 'Wild Dance of the Star Cluster', text: 'She becomes eight stars that cut the target from eight sides in under a second; nothing can touch her meanwhile.' },
          { key: 'E', name: 'Ginga Ryūsei-hō', kanji: '銀河流星砲', means: 'Galaxy Meteor Cannon', text: 'A vast spiralling beam of stars, 150 m long.' },
          { key: 'R', name: 'Hoshi no Toki', kanji: '星の刻', means: 'The Hour of the Stars', text: 'Time stops for every enemy for 5 seconds.' },
          { key: 'G', name: 'Akatsuki', kanji: '暁', means: 'Daybreak', text: 'The dawn breaks: a wall of light 140 m wide sweeps 170 m across everything ahead, unblockable, and the night lifts.' },
          { key: 'F', name: 'Seal', kanji: '封', text: 'Seals everything: back to the sealed katana, and the sky returns.' },
        ],
      },
    ],
    passives: [
      { key: '—', name: 'Myōjō no Kago', kanji: '明星の加護', means: 'The Morning Star\'s Protection', text: 'The first time she would die, the morning star rises behind her: she comes back at 60 % HP with a burst of light that throws everyone around her back.' },
      { key: '—', name: 'Mitsuboshi', kanji: '三つ星', means: 'Three Stars', text: 'The three stones of her necklace are her three seals: one lights with each release.' },
      { key: 'V', name: 'Reiatsu flare', kanji: '霊圧', text: 'Her reiatsu flares gold: +25 % power while it burns.' },
      { key: 'Shift', name: 'Shunpo', kanji: '瞬歩', text: 'Flash steps that grow longer with each form (26 → 28 → 34 → 40 m).' },
    ],
    numbers: [
      { label: 'Form', values: ['Sealed', 'Shikai', 'Bankai', 'Final'] },
      { label: 'Power', values: ['×1.6', '×2.4', '×3.4', '×5'] },
      { label: 'Damage taken', values: ['×0.8', '×0.65', '×0.5', '×0.2'] },
      { label: 'Regeneration', values: ['—', '2 rei/s', '1.5 % HP + 8 rei /s', '3 % HP + 20 rei /s'] },
      { label: 'Health · reiatsu', values: ['2600 · 400', '2600 · 400', '2600 · 400', '2600 · 400'] },
    ],
    tips: [
      'In the Shikai, land three or four cuts before Seiza-giri: every mark is another burst.',
      'Hoshiyomi turns an opponent\'s rush against them — read the sky, then let them come.',
      'In the Bankai, Kuro-boshi holds a crowd in place for Ryūseigun; Orion\'s sword is the one that cuts a building in half.',
      'In the final form, Hoshi no Toki → Seigun Ranbu → Chōshinsei ends almost any fight; Akatsuki ends the rest.',
      'Sandbox mode lets you try everything without limits.',
    ],
  },
];

const CSS = `
#wiki { position: absolute; inset: 0; z-index: 20; display: flex; align-items: center; justify-content: center; background: rgba(4,5,12,.78); font-family: 'Zen Kaku Gothic New', system-ui, sans-serif; color: #f3f1ec; pointer-events: auto; }
#wiki .panel { position: relative; width: min(980px, 96vw); height: min(92vh, 1100px); display: flex; flex-direction: column; border: 1px solid rgba(255,210,122,.45); box-shadow: 0 0 40px rgba(255,210,122,.18); background:
  radial-gradient(1px 1px at 12% 18%, rgba(255,255,255,.8), transparent), radial-gradient(1px 1px at 72% 9%, rgba(255,240,200,.7), transparent),
  radial-gradient(1.5px 1.5px at 88% 34%, rgba(200,215,255,.8), transparent), radial-gradient(1px 1px at 33% 62%, rgba(255,255,255,.6), transparent),
  radial-gradient(1px 1px at 58% 81%, rgba(255,240,200,.6), transparent), radial-gradient(1.5px 1.5px at 6% 88%, rgba(200,215,255,.7), transparent),
  linear-gradient(170deg, #121734 0%, #0c0f22 55%, #160f1c 100%); }
#wiki .top { display: flex; align-items: center; gap: 14px; padding: 14px 20px; border-bottom: 1px solid rgba(255,210,122,.25); }
#wiki .top h2 { margin: 0; font-family: 'Dela Gothic One', sans-serif; font-size: 18px; letter-spacing: .25em; text-transform: uppercase; color: #ffd27a; flex: 1; }
#wiki .top button { cursor: pointer; background: none; border: 1px solid rgba(255,255,255,.3); color: #f3f1ec; font-size: 13px; padding: 5px 12px; letter-spacing: .12em; }
#wiki .top button:hover { border-color: #ffd27a; color: #ffd27a; }
#wiki .tabs { display: flex; gap: 8px; padding: 10px 20px 0; flex-wrap: wrap; }
#wiki .tab { cursor: pointer; padding: 6px 14px; border: 1px solid rgba(255,210,122,.35); background: rgba(255,210,122,.06); color: #f3f1ec; font-size: 12px; letter-spacing: .12em; }
#wiki .tab.sel { background: #ffd27a; color: #141418; }
#wiki .body { overflow-y: auto; padding: 8px 26px 30px; line-height: 1.55; font-size: 14px; }
#wiki .hero { display: flex; gap: 22px; align-items: center; margin: 14px 0 6px; }
#wiki .hero .hk { font-family: 'Yuji Syuku', serif; font-size: 64px; line-height: 1; color: #ffd27a; text-shadow: 0 0 22px rgba(255,210,122,.6); }
#wiki .hero .nm { font-family: 'Dela Gothic One', sans-serif; font-size: 34px; letter-spacing: .12em; }
#wiki .hero .tt { font-size: 13px; letter-spacing: .18em; text-transform: uppercase; opacity: .8; }
#wiki .ded { margin: 12px 0 4px; padding: 10px 14px; border-left: 3px solid #ffd27a; background: rgba(255,210,122,.08); font-style: italic; }
#wiki h3 { font-family: 'Dela Gothic One', sans-serif; font-size: 14px; letter-spacing: .3em; text-transform: uppercase; color: #ffd27a; margin: 24px 0 8px; border-bottom: 1px solid rgba(255,210,122,.22); padding-bottom: 4px; }
#wiki h4 { margin: 18px 0 4px; font-size: 17px; font-family: 'Dela Gothic One', sans-serif; letter-spacing: .06em; }
#wiki h4 .k { font-family: 'Yuji Syuku', serif; color: #ffd27a; margin-left: 10px; font-size: 18px; }
#wiki .cmd { margin: 2px 0 6px; color: #c6d8ff; }
#wiki .cmd i { opacity: .8; }
#wiki .look { opacity: .92; }
#wiki .stats { display: flex; gap: 6px; flex-wrap: wrap; margin: 8px 0; }
#wiki .stats span { font-size: 12px; padding: 3px 9px; border: 1px solid rgba(198,216,255,.35); background: rgba(198,216,255,.07); }
#wiki table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 13.5px; }
#wiki td, #wiki th { padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,.08); vertical-align: top; text-align: left; }
#wiki th { color: #ffd27a; font-weight: 700; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; }
#wiki td.key { width: 54px; white-space: nowrap; color: #141418; }
#wiki td.key b { display: inline-block; min-width: 34px; text-align: center; background: #ffd27a; padding: 1px 6px; font-size: 12px; }
#wiki td.mv { width: 230px; }
#wiki td.mv b { display: block; }
#wiki td.mv .wk { font-family: 'Yuji Syuku', serif; color: #ffd27a; }
#wiki td.mv .mn { display: block; font-size: 12px; opacity: .7; font-style: italic; }
#wiki .prof td:first-child { width: 120px; color: #ffd27a; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; }
#wiki ul { margin: 6px 0; padding-left: 20px; }
#wiki .wplay { margin-top: 22px; cursor: pointer; font-family: 'Dela Gothic One', sans-serif; letter-spacing: .25em; padding: 12px 28px; background: #ffd27a; color: #141418; border: none; font-size: 15px; }
#wiki .wplay:hover { background: #fff0c8; }
@media (max-width: 640px) { #wiki td.mv { width: auto; } #wiki .hero .hk { font-size: 44px; } #wiki .hero .nm { font-size: 24px; } #wiki .body { padding: 8px 14px 24px; } }
`;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function moveRows(moves: WikiMove[]): string {
  return moves
    .map((m) => `<tr><td class="key"><b>${esc(m.key)}</b></td><td class="mv"><b>${esc(m.name)}</b>${m.kanji ? `<span class="wk">${esc(m.kanji)}</span>` : ''}${m.means ? `<span class="mn">${esc(m.means)}</span>` : ''}</td><td>${esc(m.text)}</td></tr>`)
    .join('');
}

function page(e: WikiEntry, canPlay: boolean): string {
  const keys = ['LMB', 'RMB', 'Q', 'E', 'R', 'G', 'F'];
  const grid = keys
    .map((k) => `<tr><td class="key"><b>${k}</b></td>${e.forms.map((f) => `<td>${esc(f.moves.find((m) => m.key === k)?.name ?? '—')}</td>`).join('')}</tr>`)
    .join('');
  return `
    <div class="hero"><div class="hk">${esc(e.kanji)}</div><div><div class="nm">${esc(e.name)}</div><div class="tt">${esc(e.title)}</div></div></div>
    <div class="ded">${esc(e.dedication)}</div>
    <h3>Story</h3>${e.lore.map((p) => `<p>${esc(p)}</p>`).join('')}
    <h3>Profile</h3><table class="prof">${e.profile.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</table>
    <h3>Zanpakutō — ${esc(e.zanpakuto.name)} <span style="font-family:'Yuji Syuku',serif">${esc(e.zanpakuto.kanji)}</span></h3>
    <p><i>${esc(e.zanpakuto.means)}</i></p>${e.zanpakuto.text.map((p) => `<p>${esc(p)}</p>`).join('')}
    <h3>Forms and powers</h3>
    ${e.forms
      .map(
        (f) => `<h4>${esc(f.name)}<span class="k">${esc(f.kanji)}</span></h4>
      ${f.command ? `<div class="cmd">${esc(f.command)}${f.means ? ` — <i>${esc(f.means)}</i>` : ''}</div>` : ''}
      <div class="look">${esc(f.look)}</div>
      <div class="stats">${f.stats.map((s) => `<span>${esc(s)}</span>`).join('')}</div>
      <table>${moveRows(f.moves)}</table>`,
      )
      .join('')}
    <h3>Passives</h3><table>${moveRows(e.passives)}</table>
    <h3>Controls by form</h3>
    <table><tr><th>Key</th>${e.forms.map((f) => `<th>${esc(f.name.split(' — ')[0])}</th>`).join('')}</tr>${grid}</table>
    <h3>Numbers</h3>
    <table>${e.numbers.map((n, i) => `<tr>${i === 0 ? `<th>${esc(n.label)}</th>${n.values.map((v) => `<th>${esc(v)}</th>`).join('')}` : `<td>${esc(n.label)}</td>${n.values.map((v) => `<td>${esc(v)}</td>`).join('')}`}</tr>`).join('')}</table>
    <h3>Tips</h3><ul>${e.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    ${canPlay ? `<button class="wplay" data-id="${esc(e.id)}">PLAY AS ${esc(e.name.toUpperCase())}</button>` : ''}`;
}

/**
 * Open the wiki over `parent`. `onPick(id)` (optional) selects the character on the start screen; the page closes on
 * the × button, a click outside the panel, or Escape.
 */
export function openWiki(parent: HTMLElement, entries: WikiEntry[] = SPECIAL_WIKI, onPick?: (id: string) => void): () => void {
  if (!document.getElementById('wiki-css')) {
    const st = document.createElement('style');
    st.id = 'wiki-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  const el = document.createElement('div');
  el.id = 'wiki';
  let cur = entries[0];
  el.innerHTML = `<div class="panel"><div class="top"><h2>✦ Special characters wiki</h2><button class="x">CLOSE ✕</button></div>
    <div class="tabs">${entries.map((e) => `<button class="tab" data-id="${esc(e.id)}">${esc(e.name)} ${esc(e.kanji)}</button>`).join('')}</div>
    <div class="body"></div></div>`;
  parent.appendChild(el);
  const body = el.querySelector('.body') as HTMLElement;
  const show = (e: WikiEntry) => {
    cur = e;
    body.innerHTML = page(e, !!onPick);
    body.scrollTop = 0;
    el.querySelectorAll<HTMLElement>('.tab').forEach((t) => t.classList.toggle('sel', t.dataset.id === e.id));
    body.querySelector('.wplay')?.addEventListener('click', (ev) => {
      ev.stopPropagation();
      onPick?.(cur.id);
      close();
    });
  };
  el.querySelectorAll<HTMLElement>('.tab').forEach((t) =>
    t.addEventListener('click', (ev) => {
      ev.stopPropagation();
      show(entries.find((x) => x.id === t.dataset.id) ?? entries[0]);
    }),
  );
  const onKey = (ev: KeyboardEvent) => {
    ev.stopPropagation();
    if (ev.key === 'Escape') close();
  };
  const close = () => {
    window.removeEventListener('keydown', onKey, true);
    el.remove();
  };
  window.addEventListener('keydown', onKey, true);
  el.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (ev.target === el) close();
  });
  el.querySelector('.x')!.addEventListener('click', (ev) => {
    ev.stopPropagation();
    close();
  });
  show(cur);
  return close;
}
