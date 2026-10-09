// Vs Player 2: two copies of the game, one fighter each, joined by a lobby code. The host opens a lobby under the code
// on PeerJS's public broker, the guest dials it, and from then on the fight goes peer to peer over a WebRTC data
// channel. Each side runs the whole simulation. What travels: each player's pad every step (held keys, presses, the
// view's yaw) — the other side drives that fighter with the same PlayerController — and ten times a second a snapshot
// of each player's own fighter: its owner is the authority on where it is, how hurt it is and what form it is in, and
// the other side eases its copy toward that word. `?net=local` swaps WebRTC for a BroadcastChannel between two tabs of
// one browser (tests, LAN-less demos).
import Peer, { type DataConnection } from 'peerjs';
import * as THREE from 'three';
import type { Action } from '../game/input';
import type { PadSource, ViewSource } from '../game/player';
import type { Fighter } from '../game/fighter';
import type { Kit } from '../game/kits/kit';
import type { Game } from '../game/game';

/** bumped whenever the messages change: both sides must speak the same */
export const NET_VERSION = 3;

/** the actions a pad carries, one bit each */
export const NET_ACTIONS: Action[] = ['forward', 'back', 'left', 'right', 'jump', 'descend', 'dash', 'sprint', 'attack', 'heavy', 'skill1', 'skill2', 'skill3', 'release', 'mask', 'flare', 'lock', 'guard'];

export type NetMsg =
  | { t: 'hello'; char: string; map: string; v: number }
  | { t: 'start'; host: string; guest: string; map: string }
  | { t: 'pad'; h: number; p: number; y: number }
  | { t: 'st'; r: number; p: [number, number, number]; v: [number, number, number]; yaw: number; hp: number; rei: number; dead: boolean; form: string }
  | { t: 'round'; n: number }
  | { t: 'bye' };

const num = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const vec3 = (x: unknown): x is [number, number, number] => Array.isArray(x) && x.length === 3 && x.every(num);
const str = (x: unknown, max = 64): x is string => typeof x === 'string' && x.length <= max;

/** Whatever arrives from the other player is checked field by field before anything uses it. */
export function parseMsg(d: unknown): NetMsg | null {
  if (!d || typeof d !== 'object') return null;
  const m = d as Record<string, unknown>;
  switch (m.t) {
    case 'hello': return str(m.char) && str(m.map, 16) && num(m.v) ? { t: 'hello', char: m.char, map: m.map, v: m.v } : null;
    case 'start': return str(m.host) && str(m.guest) && str(m.map, 16) ? { t: 'start', host: m.host, guest: m.guest, map: m.map } : null;
    case 'pad': return num(m.h) && num(m.p) && num(m.y) ? { t: 'pad', h: m.h | 0, p: m.p | 0, y: m.y } : null;
    case 'st':
      return num(m.r) && vec3(m.p) && vec3(m.v) && num(m.yaw) && num(m.hp) && num(m.rei) && typeof m.dead === 'boolean' && str(m.form, 96)
        ? { t: 'st', r: m.r | 0, p: m.p, v: m.v, yaw: m.yaw, hp: m.hp, rei: m.rei, dead: m.dead, form: m.form }
        : null;
    case 'round': return num(m.n) ? { t: 'round', n: m.n | 0 } : null;
    case 'bye': return { t: 'bye' };
    default: return null;
  }
}

export interface Transport {
  send(m: NetMsg): void;
  onMessage: ((m: NetMsg) => void) | null;
  onClose: (() => void) | null;
  close(): void;
}

class PeerTransport implements Transport {
  onMessage: ((m: NetMsg) => void) | null = null;
  onClose: (() => void) | null = null;
  private closed = false;
  constructor(private conn: DataConnection, private peer: Peer) {
    conn.on('data', (d) => {
      const m = parseMsg(d);
      if (m) this.onMessage?.(m);
    });
    const end = () => {
      if (this.closed) return;
      this.closed = true;
      this.onClose?.();
    };
    conn.on('close', end);
    conn.on('error', end);
    peer.on('disconnected', () => { if (!this.closed) peer.reconnect(); });
  }
  send(m: NetMsg): void {
    if (!this.closed && this.conn.open) this.conn.send(m);
  }
  close(): void {
    this.closed = true;
    try { this.conn.close(); } catch { /* already gone */ }
    this.peer.destroy();
  }
}

/** Two tabs of one browser: a BroadcastChannel per lobby, messages tagged by sender. */
class ChannelTransport implements Transport {
  onMessage: ((m: NetMsg) => void) | null = null;
  onClose: (() => void) | null = null;
  constructor(private ch: BroadcastChannel, private me: string) {
    ch.onmessage = (e) => {
      const d = e.data as { from?: string; m?: unknown } | null;
      if (!d || d.from === this.me) return;
      if ((d.m as { t?: string } | undefined)?.t === 'bye') {
        this.onClose?.();
        return;
      }
      const m = parseMsg(d.m);
      if (m) this.onMessage?.(m);
    };
  }
  send(m: NetMsg): void {
    this.ch.postMessage({ from: this.me, m });
  }
  close(): void {
    this.send({ t: 'bye' });
    this.ch.close();
  }
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** a five-letter lobby code without the easily confused letters */
export function makeCode(): string {
  let s = '';
  const a = new Uint32Array(5);
  crypto.getRandomValues(a);
  for (const x of a) s += CODE_CHARS[x % CODE_CHARS.length];
  return s;
}

export function cleanCode(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
}

const peerId = (code: string) => `reishi-v${NET_VERSION}-${code}`;

/** Open a lobby under `code`; `onGuest` gets the transport once player 2 is in. Returns a cancel. */
export function hostLobby(code: string, local: boolean, onGuest: (t: Transport) => void, onError: (msg: string) => void): () => void {
  if (local) {
    const ch = new BroadcastChannel('reishi-lobby-' + code);
    const me = 'host-' + Math.random().toString(36).slice(2);
    let done = false;
    ch.onmessage = (e) => {
      const d = e.data as { knock?: string } | null;
      if (done || !d?.knock) return;
      done = true;
      ch.postMessage({ welcome: d.knock, from: me });
      onGuest(new ChannelTransport(ch, me));
    };
    return () => { if (!done) ch.close(); };
  }
  const peer = new Peer(peerId(code), { debug: 0 });
  let taken = false;
  peer.on('connection', (conn) => {
    if (taken) {
      conn.on('open', () => conn.close());
      return;
    }
    taken = true;
    conn.on('open', () => onGuest(new PeerTransport(conn, peer)));
  });
  peer.on('error', (e) => onError(lobbyError(e)));
  return () => { if (!taken) peer.destroy(); };
}

/** Dial the lobby `code`; `onOpen` gets the transport. Returns a cancel. */
export function joinLobby(code: string, local: boolean, onOpen: (t: Transport) => void, onError: (msg: string) => void): () => void {
  if (local) {
    const ch = new BroadcastChannel('reishi-lobby-' + code);
    const me = 'guest-' + Math.random().toString(36).slice(2);
    let done = false;
    ch.onmessage = (e) => {
      const d = e.data as { welcome?: string } | null;
      if (done || d?.welcome !== me) return;
      done = true;
      onOpen(new ChannelTransport(ch, me));
    };
    ch.postMessage({ knock: me });
    const retry = setInterval(() => (done ? clearInterval(retry) : ch.postMessage({ knock: me })), 700);
    return () => { clearInterval(retry); if (!done) ch.close(); };
  }
  const peer = new Peer({ debug: 0 });
  let opened = false;
  peer.on('open', () => {
    const conn = peer.connect(peerId(code), { reliable: true });
    conn.on('open', () => {
      opened = true;
      onOpen(new PeerTransport(conn, peer));
    });
  });
  peer.on('error', (e) => onError(lobbyError(e)));
  const timeout = setTimeout(() => { if (!opened) onError('no lobby answered under that code'); }, 15000);
  return () => { clearTimeout(timeout); if (!opened) peer.destroy(); };
}

function lobbyError(e: unknown): string {
  const type = (e as { type?: string }).type;
  if (type === 'unavailable-id') return 'that lobby code is taken — try again';
  if (type === 'peer-unavailable') return 'no lobby with that code';
  if (type === 'network' || type === 'server-error' || type === 'socket-error') return 'cannot reach the lobby server (check the connection)';
  if (type === 'browser-incompatible') return 'this browser cannot do peer-to-peer (WebRTC)';
  return type ?? String(e);
}

/** The other player's pad: what they hold, what they just pressed, which way they look. */
export class RemotePad implements PadSource, ViewSource {
  private heldBits = 0;
  private presses = new Map<Action, number>();
  yaw = 0;

  apply(h: number, p: number, yaw: number): void {
    this.heldBits = h;
    this.yaw = yaw;
    if (p) {
      const now = performance.now();
      NET_ACTIONS.forEach((a, i) => { if (p & (1 << i)) this.presses.set(a, now); });
    }
  }

  held(a: Action): boolean {
    const i = NET_ACTIONS.indexOf(a);
    return i >= 0 && (this.heldBits & (1 << i)) !== 0;
  }

  /** a press stays usable a little longer than a local one: it has crossed the network */
  pressed(a: Action, windowMs = 160): boolean {
    const t = this.presses.get(a);
    if (t === undefined) return false;
    if (performance.now() - t > Math.max(windowMs, 380)) {
      this.presses.delete(a);
      return false;
    }
    this.presses.delete(a);
    return true;
  }

  flatForward(out: THREE.Vector3): THREE.Vector3 {
    return out.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
  }
}

export interface NetSides {
  /** this machine's fighter (and kit) */
  me(): { f: Fighter; kit: Kit } | null;
  /** the other player's fighter (and kit) on this machine */
  them(): { f: Fighter; kit: Kit } | null;
}

/**
 * The running match: sends this player's pad every step and a snapshot of their fighter every sixth, feeds the other
 * player's pad to `remotePad`, and eases the other fighter toward its owner's snapshots (snapping when far off);
 * HP, reiatsu and death follow the owner (the copy here cannot die of the blows it takes here: set it `immortal`). A
 * form that came out different here (a press refused while busy) is pressed again until the names agree.
 */
export class NetSession {
  readonly remotePad = new RemotePad();
  private pending = 0;
  private stepN = 0;
  private target: { p: THREE.Vector3; v: THREE.Vector3; yaw: number; at: number } | null = null;
  private form = '';
  private formOffT = 0;
  private formRetryT = 0;
  private formTries = 0;
  onRound: ((n: number) => void) | null = null;
  /** the round being fought: snapshots from another round (sent before the news of a new one arrived) are dropped */
  round = 1;
  onBye: (() => void) | null = null;
  /** seconds since the last message from the other player */
  quietT = 0;
  readonly offPress: () => void;

  constructor(readonly g: Game, readonly t: Transport, readonly sides: NetSides) {
    const inp = g.input;
    const onPress = (code: string) => {
      NET_ACTIONS.forEach((a, i) => { if (inp.bindings[a].includes(code)) this.pending |= 1 << i; });
    };
    inp.pressListeners.add(onPress);
    this.offPress = () => inp.pressListeners.delete(onPress);
    t.onMessage = (m) => this.receive(m);
    t.onClose = () => this.bye();
    // leaving the page says goodbye; a peer silent for 25 s (a closed laptop) is gone too
    window.addEventListener('pagehide', () => this.t.send({ t: 'bye' }));
  }

  private gone = false;
  private bye(): void {
    if (this.gone) return;
    this.gone = true;
    this.onBye?.();
  }

  private receive(m: NetMsg): void {
    this.quietT = 0;
    if (m.t === 'pad') this.remotePad.apply(m.h, m.p, m.y);
    else if (m.t === 'st') {
      if (m.r !== this.round) return;
      const s = this.sides.them();
      if (!s) return;
      const f = s.f;
      const p = new THREE.Vector3(...m.p);
      if (f.body.pos.distanceTo(p) > 4) {
        f.body.pos.copy(p);
        f.body.prev.copy(p);
        f.body.vel.set(...m.v);
        this.target = null;
      } else this.target = { p, v: new THREE.Vector3(...m.v), yaw: m.yaw, at: performance.now() };
      f.hp = Math.min(f.maxHp, Math.max(0, m.hp));
      f.rei = Math.min(f.maxRei, Math.max(0, m.rei));
      if (m.dead && !f.dead) {
        f.hp = 0;
        this.g.kill(f, this.sides.me()?.f ?? null, new THREE.Vector3());
      }
      if (m.form !== this.form) {
        this.form = m.form;
        this.formTries = 0;
      }
    } else if (m.t === 'round') {
      this.round = m.n;
      this.target = null;
      this.form = '';
      this.onRound?.(m.n);
    }
    else if (m.t === 'bye') this.bye();
  }

  /** one sim step */
  step(dt: number): void {
    const g = this.g;
    this.quietT += dt;
    if (this.quietT > 25) this.bye();
    let h = 0;
    NET_ACTIONS.forEach((a, i) => { if (g.input.held(a)) h |= 1 << i; });
    this.t.send({ t: 'pad', h, p: this.pending, y: g.cam.yaw });
    this.pending = 0;
    const me = this.sides.me();
    if (me && ++this.stepN % 6 === 0) {
      const f = me.f;
      this.t.send({ t: 'st', r: this.round, p: [f.body.pos.x, f.body.pos.y, f.body.pos.z], v: [f.body.vel.x, f.body.vel.y, f.body.vel.z], yaw: f.yaw, hp: f.hp, rei: f.rei, dead: f.dead, form: me.kit.formName() });
    }
    const them = this.sides.them();
    if (!them || them.f.dead) return;
    // ease toward where its owner says it is (carried forward by its velocity since)
    if (this.target) {
      const f = them.f;
      const lag = Math.min(0.25, (performance.now() - this.target.at) / 1000);
      const want = this.target.p.clone().addScaledVector(this.target.v, lag);
      const err = f.body.pos.distanceTo(want);
      if (err > 0.04) {
        const k = 1 - Math.exp(-dt * (err > 1.2 ? 14 : 7));
        f.body.pos.lerp(want, k);
      }
    }
    // the form: press release again while the names disagree (a press refused here)
    this.formRetryT = Math.max(0, this.formRetryT - dt);
    if (this.form && them.kit.formName() !== this.form) {
      this.formOffT += dt;
      if (this.formOffT > 0.7 && this.formRetryT <= 0 && this.formTries < 4 && !them.f.busy) {
        this.formTries++;
        this.formRetryT = 1.6;
        them.kit.release();
      }
    } else this.formOffT = 0;
  }

  close(): void {
    this.offPress();
    this.t.close();
  }
}
