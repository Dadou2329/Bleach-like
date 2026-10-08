// Reactions any humanoid rig can play (bones a rig lacks are skipped): kits that force a pose on whoever they hit
// register these on the victim's animator on demand (`registerReactions`).
import type { Animator } from '../anim/animator';
import type { ClipDef, KeyDef } from '../anim/clip';

type B = NonNullable<KeyDef['b']>;
const body = (t: number, b: B, hips?: KeyDef['hips'], ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

/** borne down onto both knees under a weight (Wabisuke), the back bowed and the head hung "in apology" */
const KNEEL: B = {
  hips: [8, 0, 0], spine: [18, 0, 0], chest: [14, 0, 0], neck: [14, 0, 0], head: [22, 0, 0],
  'thigh.L': [-6, 0, 6], 'shin.L': [92, 0, 0], 'foot.L': [30, 0, 0],
  'thigh.R': [-4, 0, -6], 'shin.R': [92, 0, 0], 'foot.R': [30, 0, 0],
  'upperarm.L': [-14, 0, 12], 'forearm.L': [-20, 0, 0], 'hand.L': [10, 0, 0],
  'upperarm.R': [-14, 0, -12], 'forearm.R': [-20, 0, 0],
};
/** flattened: the knees spread, the hands on the ground, the forehead nearly down */
const PIN: B = {
  hips: [20, 0, 0], spine: [34, 0, 0], chest: [26, 0, 0], neck: [10, 0, 0], head: [16, 0, 0],
  'thigh.L': [-20, 0, 14], 'shin.L': [110, 0, 0], 'foot.L': [40, 0, 0],
  'thigh.R': [-18, 0, -14], 'shin.R': [110, 0, 0], 'foot.R': [40, 0, 0],
  'upperarm.L': [-62, 0, 16], 'forearm.L': [-18, 0, 0], 'hand.L': [40, 0, 0],
  'upperarm.R': [-62, 0, -16], 'forearm.R': [-18, 0, 0],
};

/** asleep where it stood (Hakufuku): sunk onto its knees, slumped forward, the arms hanging, the head lolled aside */
const SLUMP: B = {
  hips: [6, 0, 3], spine: [24, 0, 4], chest: [16, 0, 4], neck: [18, 0, 8], head: [24, 8, 20],
  'thigh.L': [-4, 0, 8], 'shin.L': [98, 0, 0], 'foot.L': [32, 0, 0],
  'thigh.R': [-2, 0, -8], 'shin.R': [98, 0, 0], 'foot.R': [32, 0, 0],
  'upperarm.L': [6, 0, 6], 'forearm.L': [-8, 0, 0], 'hand.L': [6, 0, 0],
  'upperarm.R': [6, 0, -6], 'forearm.R': [-8, 0, 0],
};

export const REACTION_CLIPS: ClipDef[] = [
  {
    name: 'weighed_kneel', dur: 0.32, fadeIn: 0.05, fadeOut: 0.3,
    keys: [
      body(0, { hips: [4, 0, 0], spine: [8, 0, 0], 'thigh.L': [-30, 0, 4], 'shin.L': [50, 0, 0], 'thigh.R': [-24, 0, -4], 'shin.R': [44, 0, 0] }, [0, -0.18, 0]),
      body(0.12, { ...KNEEL, spine: [24, 0, 0], head: [10, 0, 0] }, [0, -0.44, -0.04], 'outExpo'),
      body(0.32, KNEEL, [0, -0.41, -0.05], 'inOut'),
    ],
  },
  {
    name: 'slumber', dur: 0.7, fadeIn: 0.12, fadeOut: 0.35,
    keys: [
      body(0, { hips: [4, 0, 0], spine: [10, 0, 0], neck: [8, 0, 0], head: [12, 0, 6], 'thigh.L': [-22, 0, 4], 'shin.L': [40, 0, 0], 'thigh.R': [-18, 0, -4], 'shin.R': [36, 0, 0] }, [0, -0.14, 0]),
      body(0.36, { ...SLUMP, head: [16, 2, 8] }, [0, -0.43, -0.05], 'inOut'),
      body(0.7, SLUMP, [0, -0.42, -0.05], 'inOut'),
    ],
  },
  {
    name: 'weighed_pin', dur: 0.4, fadeIn: 0.06, fadeOut: 0.3,
    keys: [
      body(0, KNEEL, [0, -0.41, -0.05]),
      body(0.14, PIN, [0, -0.52, 0.02], 'outExpo'),
      body(0.4, PIN, [0, -0.5, 0.02], 'inOut'),
    ],
  },
];

/** make sure an animator knows the reaction clips (a form change builds a new animator) */
export function registerReactions(anim: Animator): void {
  if (!anim.has('weighed_kneel')) anim.register(REACTION_CLIPS);
}
