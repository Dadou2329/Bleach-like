/** Minimal typed event bus. Sim emits, render/audio/UI subscribe. */
export class EventBus<Events extends Record<string, unknown>> {
  private handlers = new Map<keyof Events, Set<(e: never) => void>>();

  on<K extends keyof Events>(type: K, fn: (e: Events[K]) => void): () => void {
    let set = this.handlers.get(type);
    if (!set) this.handlers.set(type, (set = new Set()));
    set.add(fn as (e: never) => void);
    return () => set!.delete(fn as (e: never) => void);
  }

  emit<K extends keyof Events>(type: K, e: Events[K]): void {
    const set = this.handlers.get(type);
    if (!set) return;
    for (const fn of set) (fn as (e: Events[K]) => void)(e);
  }

  clear(): void {
    this.handlers.clear();
  }
}
