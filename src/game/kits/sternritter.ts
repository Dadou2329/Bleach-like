// What the Sternritter kits share (docs/roster/H3-sternritter-2.md §1): Hirenkyaku's ribbon of reishi under the soles
// and its streak, and the Vollständig's flight (the body floats on its wings; Space climbs, Ctrl sinks; an AI keeps
// level with its target).
import type { Fighter } from '../fighter';
import type { Game } from '../game';
import { TEX_GLOW, TEX_STREAK } from '../../vfx/sprites';

/** the blue-white of the ribbon, tinted by the Schrift's own colour */
export type Rgb = [number, number, number];
const RIBBON: Rgb = [0.55, 0.85, 0.97];

/** Hirenkyaku's start: a ring of light at the soles, in the ribbon's blue and the Schrift's colour. */
export function hirenkyakuPuff(g: Game, f: Fighter, tint: Rgb = RIBBON): void {
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2;
    const c = Math.random() < 0.5 ? tint : RIBBON;
    g.engine.glow.spawn({ x: f.pos.x, y: f.pos.y + 0.05, z: f.pos.z, vx: Math.cos(a) * 2, vy: 0.3, vz: Math.sin(a) * 2, size: 0.25, sizeEnd: 0.05, life: 0.35, r: c[0], g: c[1], b: c[2], alpha: 0.8, alphaEnd: 0, tex: TEX_GLOW, drag: 2 });
  }
}

/** Hirenkyaku under way: the ribbon streaming back from the soles. */
export function hirenkyakuStreak(g: Game, f: Fighter, tint: Rgb = RIBBON): void {
  for (let i = 0; i < 2; i++) g.engine.glow.spawn({ x: f.pos.x + (Math.random() - 0.5) * 0.4, y: f.pos.y + 0.05, z: f.pos.z + (Math.random() - 0.5) * 0.4, vx: -f.dashDir.x * 3, vy: 0.5, vz: -f.dashDir.z * 3, size: 0.16, sizeEnd: 0.03, life: 0.3, r: tint[0], g: tint[1], b: tint[2], alpha: 0.8, alphaEnd: 0, tex: TEX_STREAK, stretch: 3 });
}

/** The Vollständig's flight, each step: the body floats; the player climbs and sinks, an AI keeps a little above its target. */
export function vollFlight(g: Game, f: Fighter, target: Fighter | null, above = 2): void {
  f.mounted = !f.dead;
  f.mountVy = f.wishHover ? 8 : f.wishDescend ? -8 : f === g.player ? 0 : target ? Math.max(-4, Math.min(4, (target.pos.y + above - f.pos.y) * 1.5)) : 0;
}
