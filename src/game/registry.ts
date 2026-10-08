// A late-bound view of the roster for kits that build other characters while a fight runs (Carbon-Copy's copies).
// The roster imports every kit, so a kit reaches it through here rather than importing it.
import type { Fighter, FighterDef } from './fighter';
import type { Game } from './game';
import type { Kit } from './kits/kit';

export interface RosterLike {
  id: string;
  def(): FighterDef;
  kit(f: Fighter, g: Game): Kit;
}

let entries: RosterLike[] = [];

export function registerRoster(list: RosterLike[]): void {
  entries = list;
}

export function rosterById(id: string | undefined): RosterLike | null {
  return entries.find((e) => e.id === id) ?? null;
}
