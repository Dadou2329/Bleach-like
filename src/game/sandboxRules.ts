// Sandbox rules ("no limits"): every step the fighter's reiatsu is full, no cooldown or lockout runs, it cannot die
// (a lethal blow leaves 1 HP) and its wounds close quickly, and a kit with a limit of its own — a Hollow mask that
// cracks, an overload that tears an arm off — is told to keep its form going (`Kit.sandbox`). Kits that run an inner
// kit (an era's Shikai, a body inside a body) are cleared all the way down.
import type { Fighter } from './fighter';
import type { Kit } from './kits/kit';

/** objects of cooldowns (`cd`, `cd2`, `cd3`…) */
const COOLDOWN_MAP = /^(cd\d*|cooldowns?)$/;
/** single numbers that only block while above zero */
const COOLDOWN_NUM = /(Cd|Cooldown|Lock|Lockout)$/;

function clear(kit: Kit, f: Fighter, depth: number): void {
  const k = kit as unknown as Record<string, unknown>;
  for (const key of Object.keys(k)) {
    const v = k[key];
    if (typeof v === 'number') {
      if (v > 0 && COOLDOWN_NUM.test(key)) k[key] = 0;
    } else if (v && typeof v === 'object') {
      if (COOLDOWN_MAP.test(key) && !Array.isArray(v) && !(v instanceof Map)) {
        const o = v as Record<string, unknown>;
        for (const c of Object.keys(o)) if (typeof o[c] === 'number' && (o[c] as number) > 0) o[c] = 0;
      } else if (depth < 2 && key !== 'f' && typeof (v as Kit).attack === 'function' && (v as Kit).f === f) clear(v as Kit, f, depth + 1);
    }
  }
  kit.sandbox?.();
}

export function unleash(f: Fighter, kit: Kit, dt: number): void {
  if (f.dead) return;
  f.immortal = true;
  f.rei = f.maxRei;
  // wounds close a few seconds after the last blow
  if (f.hp < f.maxHp && f.game.time - f.lastHurt.at > 2.5) f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.12 * dt);
  clear(kit, f, 0);
}
