// DOM HUD: player HP / reiatsu bars, form name, ability strip with costs and cooldowns, brush-kanji
// technique callouts, floating damage numbers, lock-on marker, enemy bars and a controls panel.
import * as THREE from 'three';
import type { Game } from '../game/game';
import type { Fighter } from '../game/fighter';

export interface AbilityInfo {
  key: string;
  name: string;
  kanji?: string;
  cost?: number;
  cd?: number;
  cdMax?: number;
  active?: boolean;
  /** remaining fraction of a timed state (drawn as a draining bar) */
  timer?: number;
  /** highlight colour while active */
  tint?: string;
}

const CSS = `
#hud { position: absolute; inset: 0; pointer-events: none; font-family: 'Zen Kaku Gothic New', system-ui, sans-serif; color: #f3f1ec; user-select: none; overflow: hidden; }
#hud .plate { position: absolute; left: 22px; top: 18px; width: min(420px, 60vw); }
#hud .name { font-family: 'Dela Gothic One', sans-serif; font-size: 22px; letter-spacing: 1px; text-shadow: 0 2px 0 #000, 0 0 12px rgba(0,0,0,.6); }
#hud .form { font-size: 12px; opacity: .85; margin-left: 10px; letter-spacing: 2px; text-transform: uppercase; }
#hud .bar { position: relative; height: 12px; margin-top: 6px; background: rgba(10,10,14,.65); border: 1px solid rgba(255,255,255,.25); transform: skewX(-18deg); overflow: hidden; }
#hud .bar > i { position: absolute; inset: 0; transform-origin: left; transition: transform .08s linear; }
#hud .bar > b { position: absolute; inset: 0; transform-origin: left; background: rgba(255,255,255,.55); transition: transform .5s ease .25s; }
#hud .hp > i { background: linear-gradient(90deg, #c8102e, #ff4757); }
#hud .rei > i { background: linear-gradient(90deg, #2d74d0, #7ddffd); }
#hud .rei { height: 8px; }
#hud .abil { position: absolute; left: 50%; bottom: 22px; transform: translateX(-50%); display: flex; gap: 10px; }
#hud .ab { width: 64px; height: 64px; position: relative; background: rgba(8,8,12,.62); border: 1px solid rgba(255,255,255,.22); display: flex; flex-direction: column; align-items: center; justify-content: center; }
#hud .ab .k { position: absolute; top: 3px; left: 5px; font-size: 11px; opacity: .8; }
#hud .ab .j { font-family: 'Yuji Syuku', serif; font-size: 22px; line-height: 1; }
#hud .ab .n { font-size: 9px; letter-spacing: .5px; opacity: .85; margin-top: 4px; text-align: center; }
#hud .ab .cd { position: absolute; inset: 0; background: rgba(0,0,0,.6); transform-origin: bottom; }
#hud .ab.off { opacity: .45; }
#hud .ab.on { border-color: var(--tint, #7ddffd); box-shadow: 0 0 12px var(--tint, rgba(125,223,253,.5)); }
#hud .ab .tm { position: absolute; left: 0; right: 0; bottom: 0; height: 4px; background: var(--tint, #7ddffd); transform-origin: left; transform: scaleX(0); }
#hud .vig { position: absolute; inset: 0; opacity: 0; background: radial-gradient(ellipse at center, rgba(0,0,0,0) 52%, rgba(40,0,6,.5) 82%, rgba(12,0,2,.85) 100%); }
#hud .callout { position: absolute; left: 50%; top: 24%; transform: translate(-50%, -50%); text-align: center; opacity: 0; }
#hud .callout .kj { font-family: 'Yuji Syuku', serif; font-size: clamp(48px, 8vw, 110px); line-height: 1; text-shadow: 0 0 18px currentColor, 0 4px 0 #000; }
#hud .callout .rm { font-family: 'Dela Gothic One', sans-serif; font-size: clamp(16px, 2.2vw, 28px); letter-spacing: 6px; margin-top: 8px; text-shadow: 0 2px 0 #000; }
#hud .dmg { position: absolute; font-family: 'Dela Gothic One', sans-serif; font-size: 18px; text-shadow: 0 2px 0 #000, 0 0 6px rgba(0,0,0,.8); will-change: transform, opacity; }
#hud .lock { position: absolute; width: 34px; height: 34px; margin: -17px 0 0 -17px; border: 2px solid #ff4757; transform: rotate(45deg); box-shadow: 0 0 10px #ff4757; display: none; }
#hud .ebar { position: absolute; width: 70px; height: 5px; margin-left: -35px; background: rgba(0,0,0,.6); border: 1px solid rgba(255,255,255,.3); }
#hud .ebar > i { position: absolute; inset: 0; background: #ff4757; transform-origin: left; }
#hud .help { position: absolute; right: 18px; top: 74px; font-size: 12px; line-height: 1.55; background: rgba(8,8,12,.6); border: 1px solid rgba(255,255,255,.18); padding: 10px 14px; white-space: pre; }
#hud .hint { position: absolute; right: 18px; top: 16px; font-size: 12px; opacity: .8; }
#hud .center { position: absolute; left: 50%; top: 50%; width: 4px; height: 4px; margin: -2px; background: rgba(255,255,255,.7); border-radius: 50%; }
#hud .banner { position: absolute; left: 50%; top: 40%; transform: translate(-50%,-50%); font-family: 'Dela Gothic One', sans-serif; font-size: 28px; letter-spacing: 3px; text-shadow: 0 3px 0 #000; opacity: 0; transition: opacity .4s; text-align: center; }
#hud .boss { position: absolute; right: 22px; top: 18px; width: min(420px, 38vw); text-align: right; display: none; }
#hud .boss .bn { font-family: 'Dela Gothic One', sans-serif; font-size: 16px; letter-spacing: 4px; text-shadow: 0 2px 0 #000; }
#hud .boss .bn small { font-family: 'Zen Kaku Gothic New', system-ui, sans-serif; font-size: 11px; letter-spacing: 3px; opacity: .8; }
#hud .boss .bb { position: relative; height: 12px; margin-top: 6px; background: rgba(10,10,14,.7); border: 1px solid rgba(255,255,255,.3); transform: skewX(18deg); overflow: hidden; }
#hud .boss .bb > i { position: absolute; inset: 0; background: linear-gradient(270deg, #6a0a14, #e0262b); transform-origin: right; transition: transform .1s linear; }
#hud .combo { position: absolute; right: 40px; top: 42%; font-family: 'Dela Gothic One', sans-serif; font-size: 42px; text-shadow: 0 3px 0 #000; opacity: 0; }
#hud .combo small { display: block; font-size: 14px; letter-spacing: 4px; }
@media (max-width: 640px) { #hud .ab { width: 48px; height: 48px; } #hud .ab .j { font-size: 16px; } #hud .help { display: none; } }
`;

const HELP = `WASD  move        Mouse  look        Space  jump / air-step (hold: stand on reishi)
Shift  Shunpo (hold: flash-run)       Ctrl/C  descend
LMB  Zangetsu combo    RMB  heavy chop    Q  Getsuga Tenshō
F  Bankai              G  Hollow mask     V  reiatsu flare
Tab / MMB  lock-on     H  hide this panel`;

export class Hud {
  readonly root: HTMLDivElement;
  private hp: HTMLElement;
  private hpLag: HTMLElement;
  private rei: HTMLElement;
  private nameEl: HTMLElement;
  private formEl: HTMLElement;
  private abil: HTMLElement;
  private calloutEl: HTMLElement;
  private calloutT = 0;
  private lock: HTMLElement;
  private help: HTMLElement;
  private combo: HTMLElement;
  private comboN = 0;
  private comboT = 0;
  private banner: HTMLElement;
  private boss: HTMLElement;
  private dmg: { el: HTMLElement; p: THREE.Vector3; t: number; vx: number }[] = [];
  private ebars = new Map<number, HTMLElement>();
  private abilities: AbilityInfo[] = [];
  abilityProvider: (() => AbilityInfo[]) | null = null;
  form = 'Shikai';
  /** live form label (the player's kit) */
  formProvider: (() => string) | null = null;
  lockTarget: Fighter | null = null;
  /** duel opponent: gets the big bar at the top */
  rival: Fighter | null = null;
  /** dark-red screen edge (Hollow mask), 0..1 */
  vignette = 0;
  private vigEl: HTMLElement;
  private vigLevel = 0;

  constructor(private game: Game, parent: HTMLElement) {
    const st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    this.root = document.createElement('div');
    this.root.id = 'hud';
    this.root.innerHTML = `
      <div class="vig"></div>
      <div class="plate"><span class="name"></span><span class="form"></span>
        <div class="bar hp"><b></b><i></i></div><div class="bar rei"><i></i></div></div>
      <div class="abil"></div>
      <div class="callout"><div class="kj"></div><div class="rm"></div></div>
      <div class="lock"></div>
      <div class="combo"></div>
      <div class="boss"><div class="bn"></div><div class="bb"><i></i></div></div>
      <div class="banner"></div>
      <div class="help"></div>`;
    parent.appendChild(this.root);
    const q = (s: string) => this.root.querySelector(s) as HTMLElement;
    this.nameEl = q('.name');
    this.formEl = q('.form');
    this.hp = q('.hp > i');
    this.hpLag = q('.hp > b');
    this.rei = q('.rei > i');
    this.abil = q('.abil');
    this.calloutEl = q('.callout');
    this.lock = q('.lock');
    this.help = q('.help');
    this.help.textContent = HELP;
    this.combo = q('.combo');
    this.banner = q('.banner');
    this.boss = q('.boss');
    this.vigEl = q('.vig');
    game.hud = this;
  }

  toggleHelp(): void {
    this.help.style.display = this.help.style.display === 'none' ? '' : 'none';
  }

  callout(kanji: string, romaji: string, color = '#ffffff'): void {
    (this.calloutEl.querySelector('.kj') as HTMLElement).textContent = kanji;
    (this.calloutEl.querySelector('.rm') as HTMLElement).textContent = romaji;
    this.calloutEl.style.color = color;
    this.calloutT = 1.6;
  }

  showBanner(text: string, seconds = 2.5): void {
    this.banner.innerHTML = text;
    this.banner.style.opacity = '1';
    setTimeout(() => (this.banner.style.opacity = '0'), seconds * 1000);
  }

  damageNumber(p: THREE.Vector3, amount: number, color: string): void {
    const el = document.createElement('div');
    el.className = 'dmg';
    el.textContent = String(Math.round(amount));
    el.style.color = color;
    el.style.fontSize = `${Math.min(34, 14 + amount * 0.25)}px`;
    this.root.appendChild(el);
    this.dmg.push({ el, p: p.clone(), t: 0, vx: (Math.random() - 0.5) * 0.8 });
    if (this.dmg.length > 40) this.dmg.shift()!.el.remove();
    this.comboN++;
    this.comboT = 2.2;
  }

  onKill(_f: Fighter): void {
    /* hook for score */
  }

  private project(p: THREE.Vector3): { x: number; y: number; vis: boolean } {
    const cam = this.game.engine.gr.camera;
    const v = p.clone().project(cam);
    const w = this.root.clientWidth, h = this.root.clientHeight;
    return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, vis: v.z < 1 && v.z > -1 };
  }

  update(dt: number): void {
    const pl = this.game.player;
    if (pl) {
      this.nameEl.textContent = pl.name;
      this.formEl.textContent = this.formProvider ? this.formProvider() : this.form;
      const hp = Math.max(0, pl.hp / pl.maxHp);
      this.hp.style.transform = `scaleX(${hp})`;
      this.hpLag.style.transform = `scaleX(${hp})`;
      this.rei.style.transform = `scaleX(${Math.max(0, pl.rei / pl.maxRei)})`;
    }
    // abilities
    if (this.abilityProvider) {
      const list = this.abilityProvider();
      if (list.length !== this.abilities.length) {
        this.abil.innerHTML = list.map(() => `<div class="ab"><span class="k"></span><span class="j"></span><span class="n"></span><div class="cd"></div><div class="tm"></div></div>`).join('');
      }
      this.abilities = list;
      const els = this.abil.children;
      list.forEach((a, i) => {
        const el = els[i] as HTMLElement;
        (el.querySelector('.k') as HTMLElement).textContent = a.key;
        (el.querySelector('.j') as HTMLElement).textContent = a.kanji ?? '';
        (el.querySelector('.n') as HTMLElement).textContent = a.name;
        const cd = a.cd && a.cdMax ? a.cd / a.cdMax : 0;
        (el.querySelector('.cd') as HTMLElement).style.transform = `scaleY(${Math.max(0, Math.min(1, cd))})`;
        (el.querySelector('.tm') as HTMLElement).style.transform = `scaleX(${Math.max(0, Math.min(1, a.timer ?? 0))})`;
        if (a.tint) el.style.setProperty('--tint', a.tint);
        else el.style.removeProperty('--tint');
        const off = pl ? !a.active && (a.cost ?? 0) > pl.rei : false;
        el.className = 'ab' + (off ? ' off' : '') + (a.active ? ' on' : '');
      });
    }
    this.vigLevel += (this.vignette - this.vigLevel) * Math.min(1, dt * 4);
    this.vigEl.style.opacity = this.vigLevel.toFixed(3);
    // callout
    if (this.calloutT > 0) {
      this.calloutT -= dt;
      const t = 1.6 - this.calloutT;
      const a = Math.min(1, t * 8) * Math.min(1, this.calloutT * 2.5);
      const s = 1.25 - Math.min(0.25, t * 1.6);
      this.calloutEl.style.opacity = String(a);
      this.calloutEl.style.transform = `translate(-50%, -50%) scale(${s})`;
    } else this.calloutEl.style.opacity = '0';
    // damage numbers
    for (let i = this.dmg.length - 1; i >= 0; i--) {
      const d = this.dmg[i];
      d.t += dt;
      d.p.y += dt * 1.1;
      d.p.x += d.vx * dt;
      const s = this.project(d.p);
      if (d.t > 0.9 || !s.vis) {
        d.el.remove();
        this.dmg.splice(i, 1);
        continue;
      }
      const pop = d.t < 0.08 ? 1.5 - d.t * 6 : 1;
      d.el.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -50%) scale(${pop})`;
      d.el.style.opacity = String(Math.min(1, (0.9 - d.t) * 3));
    }
    // combo counter
    this.comboT -= dt;
    if (this.comboT <= 0) this.comboN = 0;
    if (this.comboN >= 3) {
      this.combo.innerHTML = `${this.comboN}<small>HITS</small>`;
      this.combo.style.opacity = String(Math.min(1, this.comboT * 2));
    } else this.combo.style.opacity = '0';
    // lock marker
    if (this.lockTarget && !this.lockTarget.dead) {
      const s = this.project(this.lockTarget.center());
      this.lock.style.display = s.vis ? 'block' : 'none';
      this.lock.style.left = `${s.x}px`;
      this.lock.style.top = `${s.y}px`;
    } else this.lock.style.display = 'none';
    // boss / rival bar
    const boss = this.rival && !this.rival.dead ? this.rival : this.game.fighters.find((f) => f.def.boss && !f.dead);
    if (boss) {
      this.boss.style.display = 'block';
      const t = boss.def.title ? ` <small>· ${boss.def.title.toUpperCase()}</small>` : '';
      const label = boss.name.toUpperCase() + t;
      const bn = this.boss.querySelector('.bn') as HTMLElement;
      if (bn.innerHTML !== label) bn.innerHTML = label;
      (this.boss.querySelector('.bb > i') as HTMLElement).style.transform = `scaleX(${Math.max(0, boss.hp / boss.maxHp)})`;
    } else this.boss.style.display = 'none';
    // enemy bars
    const seen = new Set<number>();
    for (const f of this.game.fighters) {
      if (f === pl || f === this.rival || f.dead || f.hp >= f.maxHp || f.def.boss) continue;
      const top = f.pos.clone();
      top.y += f.def.height + 0.35;
      const s = this.project(top);
      if (!s.vis || (pl && f.pos.distanceTo(pl.pos) > 45)) continue;
      seen.add(f.id);
      let el = this.ebars.get(f.id);
      if (!el) {
        el = document.createElement('div');
        el.className = 'ebar';
        el.innerHTML = '<i></i>';
        this.root.appendChild(el);
        this.ebars.set(f.id, el);
      }
      el.style.left = `${s.x}px`;
      el.style.top = `${s.y}px`;
      (el.firstChild as HTMLElement).style.transform = `scaleX(${Math.max(0, f.hp / f.maxHp)})`;
    }
    for (const [id, el] of this.ebars)
      if (!seen.has(id)) {
        el.remove();
        this.ebars.delete(id);
      }
  }
}
