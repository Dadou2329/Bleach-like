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

/** held hostage by its own body (Amor on the head): its own blade raised to its throat, the chin forced up */
const HOSTAGE: B = {
  spine: [-4, 0, 0], chest: [-6, 0, 0], neck: [-10, 0, 0], head: [-18, 0, 0],
  'upperarm.R': [-62, 0, 24], 'forearm.R': [-104, 0, 0], 'hand.R': [0, 0, 20],
  'upperarm.L': [-6, 0, 10], 'forearm.L': [-14, 0, 0],
  'thigh.L': [-2, 0, 4], 'thigh.R': [-2, 0, -4],
};

/** its own weapon turned on itself (Giselle's "Die!"): the right hand drives it into its own chest, doubled over */
const STAB_UP: B = {
  spine: [-6, 0, 0], chest: [-8, 0, 0], neck: [-6, 0, 0], head: [-10, 0, 0],
  'upperarm.R': [-120, 0, 26], 'forearm.R': [-70, 0, 0], 'hand.R': [30, 0, 20],
  'upperarm.L': [-20, 0, 14], 'forearm.L': [-30, 0, 0],
};
const STAB: B = {
  hips: [6, 0, 0], spine: [22, 0, 0], chest: [16, 0, 0], neck: [12, 0, 0], head: [20, 0, 0],
  'upperarm.R': [-36, 0, 34], 'forearm.R': [-118, 0, 0], 'hand.R': [50, 0, 40],
  'upperarm.L': [-30, 0, -6], 'forearm.L': [-100, 0, 0],
  'thigh.L': [-12, 0, 4], 'shin.L': [24, 0, 0], 'thigh.R': [-8, 0, -4], 'shin.R': [20, 0, 0],
};

/** the weapon arm wrung into a spiral by nerves in it (Pernida): the shoulder hiked, the elbow bent the wrong way, the
 * forearm and the hand turned round on themselves; the body leaning away from its own arm */
const TWIST: B = {
  spine: [4, 0, 8], chest: [6, -10, 10], neck: [-6, 0, -8], head: [-10, 14, -10],
  'upperarm.R': [-44, 70, -64], 'forearm.R': [46, 150, 0], 'hand.R': [60, 120, 40],
  'upperarm.L': [-16, 0, 30], 'forearm.L': [-50, 0, 0],
  'thigh.L': [-6, 0, 6], 'shin.L': [12, 0, 0], 'thigh.R': [-2, 0, -6], 'shin.R': [8, 0, 0],
};
/** folded the wrong way at every joint: the back bent backward, the knees reversed, the arms wrenched behind */
const FOLD: B = {
  hips: [-30, 0, 0], spine: [-48, 0, 6], chest: [-40, 0, -6], neck: [-30, 0, 0], head: [-30, 20, 0],
  'thigh.L': [36, 0, 18], 'shin.L': [-46, 0, 0], 'foot.L': [30, 0, 0],
  'thigh.R': [30, 0, -22], 'shin.R': [-52, 0, 0], 'foot.R': [26, 0, 0],
  'upperarm.L': [40, 60, 70], 'forearm.L': [40, 120, 0], 'upperarm.R': [44, -60, -66], 'forearm.R': [46, -120, 0],
};
/** crushed into a ball: knees to the chest, the arms clamped round them, the head forced down */
const BALL: B = {
  hips: [60, 0, 0], spine: [70, 0, 0], chest: [50, 0, 0], neck: [40, 0, 0], head: [40, 0, 0],
  'thigh.L': [-140, 0, 8], 'shin.L': [150, 0, 0], 'foot.L': [40, 0, 0],
  'thigh.R': [-140, 0, -8], 'shin.R': [150, 0, 0], 'foot.R': [40, 0, 0],
  'upperarm.L': [-70, -40, 20], 'forearm.L': [-130, 0, 0], 'upperarm.R': [-70, 40, -20], 'forearm.R': [-130, 0, 0],
};

export const REACTION_CLIPS: ClipDef[] = [
  {
    name: 'compel_twist', dur: 0.7, fadeIn: 0.06, fadeOut: 0.3,
    keys: [
      { ...body(0, { 'upperarm.R': [-20, 10, -20] }), c: { '@ikR': [0, 0, 0] } },
      { ...body(0.25, { ...TWIST, 'forearm.R': [30, 80, 0], 'hand.R': [30, 60, 20] }, [0, -0.04, 0], 'outExpo'), c: { '@ikR': [0, 0, 0] } },
      { ...body(0.7, TWIST, [0, -0.06, 0], 'inOut'), c: { '@ikR': [0, 0, 0] } },
    ],
  },
  {
    name: 'compel_fold', dur: 0.45, fadeIn: 0.04, fadeOut: 0.35,
    keys: [
      { ...body(0, TWIST, [0, -0.06, 0]), c: { '@ikR': [0, 0, 0] } },
      { ...body(0.2, FOLD, [0, -0.5, -0.1], 'outExpo'), c: { '@ikR': [0, 0, 0] } },
      { ...body(0.45, FOLD, [0, -0.55, -0.12], 'inOut'), c: { '@ikR': [0, 0, 0] } },
    ],
  },
  {
    name: 'compel_ball', dur: 0.4, fadeIn: 0.04, fadeOut: 0.35,
    keys: [
      { ...body(0, TWIST, [0, -0.06, 0]), c: { '@ikR': [0, 0, 0] } },
      { ...body(0.18, BALL, [0, -0.4, 0], 'outExpo'), c: { '@ikR': [0, 0, 0] } },
      { ...body(0.4, BALL, [0, -0.42, 0], 'inOut'), c: { '@ikR': [0, 0, 0] } },
    ],
  },
  {
    name: 'puppet_stab', dur: 0.5, fadeIn: 0.06, fadeOut: 0.3,
    keys: [
      { ...body(0, { head: [-4, 0, 0] }), c: { '@ikR': [0, 0, 0] } },
      { ...body(0.16, STAB_UP, [0, 0.02, 0], 'outExpo'), c: { '@ikR': [0, 0, 0] } },
      { ...body(0.25, STAB, [0, -0.1, -0.04], 'outExpo'), c: { '@ikR': [0, 0, 0] } },
      { ...body(0.5, STAB, [0, -0.1, -0.04], 'inOut'), c: { '@ikR': [0, 0, 0] } },
    ],
  },
  {
    name: 'amor_hostage', dur: 0.4, fadeIn: 0.08, fadeOut: 0.3,
    keys: [
      { ...body(0, { head: [-6, 0, 0] }), c: { '@ikR': [0, 0, 0] } },
      { ...body(0.4, HOSTAGE, [0, 0, 0], 'outExpo'), c: { '@ikR': [0, 0, 0] } },
    ],
  },
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
