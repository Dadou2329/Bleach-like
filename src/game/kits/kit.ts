// Kit: a character's moveset behind one interface, so the same entry points serve the player
// (input → kit) and the duel AI (decisions → kit). Slots: LMB attack chain, RMB heavy, Q/E/R skills,
// F release (form ladder), G state toggle (mask, Shunkō…), V reiatsu flare.
import type { Fighter } from '../fighter';
import type { AbilityInfo } from '../../ui/hud';

/** One move the duel AI may pick, with the distance band where it makes sense. */
export interface AIMove {
  name: string;
  use: () => void;
  /** horizontal distance band (m) */
  min: number;
  max: number;
  /** relative pick weight */
  weight: number;
  /** AI-side cooldown (s), on top of the kit's own */
  cd: number;
  /** extra condition (form, resources…) */
  when?: () => boolean;
}

/** How a duel AI should pilot a kit. */
export interface KitAI {
  /** melee distance (m) */
  reach: number;
  /** finisher-length of the light chain (presses) */
  chain: number;
  moves: AIMove[];
  /** press F when own HP fraction drops below this (1 = right away); a list = one threshold per stage */
  releaseAt?: number | number[];
  /** press G when own HP fraction drops below this */
  toggleAt?: number;
  /** the G state is currently on (so the AI does not switch it off) */
  toggleOn?: () => boolean;
  /** keeps distance instead of brawling (ranged kits, or ranged forms) */
  ranged?: boolean | (() => boolean);
  /** played once when the walk-in ends (a taunt, a stance) */
  opener?: () => void;
  /**
   * a place to walk to instead of keeping its distance from the target (shade, a vantage point); it still faces
   * and fights the target from there
   */
  goal?: () => { x: number; z: number } | null;
}

export interface Kit {
  readonly f: Fighter;
  /** per sim step (cooldowns, timers) — called by whichever controller owns the fighter */
  update(dt: number): void;
  attack(): void;
  heavy(): void;
  skill1(): void;
  skill2?(): void;
  skill3?(): void;
  release(): void;
  toggle?(): void;
  toggleFlare(): void;
  abilities(): AbilityInfo[];
  ai(): KitAI;
  /** HUD form label */
  formName(): string;
  /**
   * still fights with bare hands when disarmed (Kaien kept punching after his sword shattered): while this returns
   * true, LMB and RMB reach the kit even with disarmT running
   */
  bareHands?(): boolean;
  /**
   * a takeover (Soul Society Ichigo's Hollow let out): while this returns true the player's controller hands the body
   * to the kit (which drives it with its own AI) and only G — fighting it off — still reaches the kit
   */
  possessed?(): boolean;
  /**
   * Sandbox ("no limits"): called every step after the generic pass (full reiatsu, cooldowns and lockouts cleared);
   * a kit with a limit of its own — a mask that cracks, an overload, a form on a clock — keeps it from running out
   */
  sandbox?(): void;
}
