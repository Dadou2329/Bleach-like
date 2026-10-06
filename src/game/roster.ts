// The playable roster: every character the player can pick or fight in a duel, with its fighter
// definition, kit factory and the assets worth warming up before they are needed (other forms).
import type { Fighter, FighterDef } from './fighter';
import type { Game } from './game';
import type { Kit } from './kits/kit';
import { ICHIGO_DEF, IchigoKit } from './kits/ichigo';
import { buildCached } from './characterFactory';
import { hollowMask, hollowMaskShatter, ichigoAsset, ichigoSword } from '../chars/ichigo';
import { GRIMMJOW_DEF, GrimmjowKit } from './kits/grimmjow';
import { grimmjowAsset, grimmjowProp } from '../chars/grimmjow';

export interface RosterEntry {
  id: string;
  name: string;
  kanji: string;
  title: string;
  /** UI accent */
  color: string;
  def(): FighterDef;
  kit(f: Fighter, g: Game): Kit;
  /** build the other forms' meshes in idle time so a release does not hitch */
  warm?(): void;
}

export const ROSTER: RosterEntry[] = [
  {
    id: 'ichigo',
    name: 'Kurosaki Ichigo',
    kanji: '一護',
    title: 'Substitute Shinigami',
    color: '#ff9a3c',
    def: () => ({ ...ICHIGO_DEF, speed: { ...ICHIGO_DEF.speed } }),
    kit: (f, g) => new IchigoKit(f, g),
    warm: () => {
      buildCached(ichigoAsset('bankai').model, true);
      buildCached(ichigoSword('bankai'), false);
      const sh = hollowMaskShatter();
      for (const m of [hollowMask(), ...sh.cracked, ...sh.shards.map((x) => x.model)]) buildCached(m, false);
    },
  },
  {
    id: 'grimmjow',
    name: 'Grimmjow Jaegerjaquez',
    kanji: '豹王',
    title: 'Sexta Espada',
    color: '#4fc6e8',
    def: () => ({ ...GRIMMJOW_DEF, speed: { ...GRIMMJOW_DEF.speed } }),
    kit: (f, g) => new GrimmjowKit(f, g),
    warm: () => {
      buildCached(grimmjowAsset('pantera').model, true);
      for (const k of ['katana', 'sheath-empty'] as const) buildCached(grimmjowProp(k), false);
    },
  },
];

export function rosterEntry(id: string | null | undefined): RosterEntry {
  return ROSTER.find((r) => r.id === id) ?? ROSTER[0];
}
