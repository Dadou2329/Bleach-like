// Spirit Body Fusion (霊体融合): a parasite's tentacle hooked into a soul — Aaroniero's red tentacles, Metastacia in
// Kaien's body. While a hook holds, the victim is drained to the owner (who heals by as much) and every step it means
// to take is turned (Fighter.scrambleT/scrambleA); a heavy blow on the owner cuts them all.
import * as THREE from 'three';
import type { Fighter } from '../fighter';
import type { DamageOpts, Game } from '../game';
import { TEX_GLOW } from '../../vfx/sprites';

interface Hook {
  o: Fighter;
  until: number;
  nextRoll: number;
  nextSpark: number;
}

const _w = new THREE.Vector3();

export class SoulHooks {
  readonly list: Hook[] = [];

  /** drain: HP/s taken (and healed); color: the sparks where it is hooked in */
  constructor(readonly owner: Fighter, readonly g: Game, readonly drain = 12, readonly color: [number, number, number] = [0.76, 0.15, 0.23]) {}

  has(o: Fighter): boolean {
    return this.list.some((h) => h.o === o);
  }

  /** a tentacle takes o for `dur` s (false: it slipped away — dead, dodging, invulnerable) */
  hook(o: Fighter, dur = 3): boolean {
    const g = this.g;
    if (o.dead || o.invuln > 0 || o.action?.invulnerable) return false;
    const old = this.list.find((h) => h.o === o);
    if (old) {
      old.until = g.time + dur;
      return true;
    }
    this.list.push({ o, until: g.time + dur, nextRoll: 0, nextSpark: 0 });
    g.damage(o, 10, this.owner, _w.subVectors(o.pos, this.owner.pos).setY(0).normalize().clone(), { knock: 2 } as DamageOpts);
    if (o === g.player) g.hud?.showBanner('Something is in your soul — your steps are not your own', 1.6);
    return true;
  }

  clear(): void {
    for (const h of this.list) h.o.scrambleT = 0;
    this.list.length = 0;
  }

  update(dt: number): void {
    const { owner: f, g } = this;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const h = this.list[i];
      const o = h.o;
      if (o.dead || f.dead || g.time >= h.until || !g.fighters.includes(o)) {
        o.scrambleT = 0;
        this.list.splice(i, 1);
        continue;
      }
      // the parasite turns its every step
      o.scrambleT = 0.3;
      if (g.time >= h.nextRoll) {
        h.nextRoll = g.time + 0.5;
        o.scrambleA = (Math.random() < 0.5 ? 1 : -1) * (1 + Math.random() * 2.1);
      }
      // drained to the owner
      const before = o.hp;
      g.drain(o, this.drain * dt, f);
      f.hp = Math.min(f.maxHp, f.hp + Math.max(0, before - o.hp));
      if (g.time >= h.nextSpark) {
        h.nextSpark = g.time + 0.15;
        const c = o.center();
        const [r, gg, b] = this.color;
        g.engine.glow.spawn({ x: c.x, y: c.y, z: c.z, vx: (Math.random() - 0.5) * 2, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 2, size: 0.2, sizeEnd: 0.05, life: 0.4, r, g: gg, b, alpha: 0.9, alphaEnd: 0, tex: TEX_GLOW });
      }
    }
  }
}
