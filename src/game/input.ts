// Keyboard + mouse input with pointer lock and press buffering (combat inputs stay valid for a short
// window so combos feel responsive). Actions are bound to key codes ('KeyW', 'Space', 'Mouse0'…).

export type Action =
  | 'forward' | 'back' | 'left' | 'right'
  | 'jump' | 'descend' | 'dash' | 'sprint'
  | 'attack' | 'heavy' | 'skill1' | 'skill2' | 'skill3' | 'release' | 'mask' | 'flare'
  | 'lock' | 'guard' | 'help' | 'pause' | 'debug';

export const DEFAULT_BINDINGS: Record<Action, string[]> = {
  forward: ['KeyW', 'ArrowUp'],
  back: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  jump: ['Space'],
  descend: ['ControlLeft', 'KeyC'],
  dash: ['ShiftLeft', 'ShiftRight'],
  sprint: ['AltLeft'],
  attack: ['Mouse0', 'KeyJ'],
  heavy: ['Mouse2', 'KeyK'],
  skill1: ['KeyQ'],
  skill2: ['KeyE'],
  skill3: ['KeyR'],
  release: ['KeyF'],
  mask: ['KeyG'],
  flare: ['KeyV'],
  lock: ['Tab', 'Mouse1'],
  guard: ['KeyX'],
  help: ['KeyH', 'F1'],
  pause: ['Escape', 'KeyP'],
  debug: ['Backquote'],
};

/** Capture the mouse; a refusal (no user gesture yet, an embedded frame) is not an error worth surfacing. */
export function lockPointer(el: HTMLElement): void {
  try {
    const r = el.requestPointerLock?.() as unknown as Promise<void> | undefined;
    r?.catch?.(() => {});
  } catch {
    /* refused */
  }
}

export class Input {
  private down = new Set<string>();
  private pressAt = new Map<string, number>();
  private releaseAt = new Map<string, number>();
  private consumed = new Set<string>();
  mouseDX = 0;
  mouseDY = 0;
  wheel = 0;
  locked = false;
  sensitivity = 0.0024;
  bindings = DEFAULT_BINDINGS;
  /** set by the game: ignore gameplay input (menus) */
  enabled = true;
  /** told of every key or button press while enabled (Vs Player 2 forwards them to the other side) */
  readonly pressListeners = new Set<(code: string) => void>();

  constructor(private el: HTMLElement) {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Tab' || e.code === 'F1' || (e.code === 'Space' && this.locked)) e.preventDefault();
      if (!this.down.has(e.code)) this.press(e.code);
    });
    window.addEventListener('keyup', (e) => this.release(e.code));
    window.addEventListener('blur', () => {
      for (const c of [...this.down]) this.release(c);
    });
    el.addEventListener('mousedown', (e) => {
      if (!this.locked && this.enabled) lockPointer(el);
      this.press('Mouse' + e.button);
    });
    window.addEventListener('mouseup', (e) => this.release('Mouse' + e.button));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.mouseDX += e.movementX;
      this.mouseDY += e.movementY;
    });
    window.addEventListener('wheel', (e) => { this.wheel += Math.sign(e.deltaY); }, { passive: true });
    document.addEventListener('pointerlockchange', () => { this.locked = document.pointerLockElement === el; });
  }

  private press(code: string): void {
    this.down.add(code);
    this.pressAt.set(code, performance.now());
    this.consumed.delete(code);
    if (this.enabled) for (const l of this.pressListeners) l(code);
  }

  private release(code: string): void {
    this.down.delete(code);
    this.releaseAt.set(code, performance.now());
  }

  /** Simulate a press (scripted tests / touch UI). */
  tap(code: string, holdMs = 60): void {
    this.press(code);
    setTimeout(() => this.release(code), holdMs);
  }

  held(a: Action): boolean {
    if (!this.enabled) return false;
    return this.bindings[a].some((c) => this.down.has(c));
  }

  /** Seconds the action has been held (0 if not held). */
  heldFor(a: Action): number {
    if (!this.held(a)) return 0;
    let t = Infinity;
    for (const c of this.bindings[a]) if (this.down.has(c)) t = Math.min(t, this.pressAt.get(c) ?? Infinity);
    return (performance.now() - t) / 1000;
  }

  /** True once per press if it happened within `windowMs` (input buffer). */
  pressed(a: Action, windowMs = 160): boolean {
    if (!this.enabled) return false;
    const now = performance.now();
    for (const c of this.bindings[a]) {
      const t = this.pressAt.get(c);
      if (t !== undefined && !this.consumed.has(c) && now - t <= windowMs) {
        this.consumed.add(c);
        return true;
      }
    }
    return false;
  }

  /** Peek without consuming. */
  peek(a: Action, windowMs = 160): boolean {
    const now = performance.now();
    return this.bindings[a].some((c) => {
      const t = this.pressAt.get(c);
      return t !== undefined && !this.consumed.has(c) && now - t <= windowMs;
    });
  }

  releasedSince(a: Action, sinceMs: number): boolean {
    const now = performance.now();
    return this.bindings[a].some((c) => {
      const t = this.releaseAt.get(c);
      return t !== undefined && now - t <= sinceMs;
    });
  }

  endFrame(): void {
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.wheel = 0;
  }
}
