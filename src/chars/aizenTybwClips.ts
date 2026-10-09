// TYBW Aizen's poses and moves (docs/kits/aizen.md). Bound: seated upright in the restraint chair, the forearms strapped
// to the armrests, the legs to the seat; what he does from it he does with a look — a tilt of the head (the glance), the
// chin lifted while the reiatsu climbs (the pillar, the seated Kurohitsugi). The release: the straps burst and he stands.
// Unbound: the captain's stance and string (aizenClips), plus a raised open hand for Goryūtenmetsu and Dankū.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { AIZEN_STANCE } from './aizenClips';

type E = [number, number, number];
const key = (t: number, b: Record<string, E>, hips?: E, ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });
const noIk: KeyDef['c'] = { '@ikR': [0, 0, 0], '@ikL': [0, 0, 0] };

/** seated: the hips dropped onto the seat, thighs level, shins down; the forearms along the armrests */
const SEATED: Record<string, E> = {
  hips: [0, 0, 0], spine: [-2, 0, 0], chest: [-2, 0, 0], neck: [2, 0, 0], head: [2, 0, 0],
  'thigh.L': [-88, 0, 6], 'shin.L': [88, 0, 0], 'foot.L': [0, 0, 0],
  'thigh.R': [-88, 0, -6], 'shin.R': [88, 0, 0], 'foot.R': [0, 0, 0],
  'upperarm.L': [-14, 0, 18], 'forearm.L': [-78, 0, 0], 'hand.L': [0, 0, 0],
  'upperarm.R': [-14, 0, -18], 'forearm.R': [-78, 0, 0], 'hand.R': [0, 0, 0],
};
const SEAT_HIPS: E = [0, -0.4, -0.05];

/** Bound in the chair: the idle is the seated pose (he cannot walk; the stance keeps the body down). */
export const AIZEN_BOUND_STANCE: StanceDef = {
  idle: SEATED,
  idleHips: -0.4,
  run: {},
  sprint: {},
  swingL: 0,
  swingR: 0,
};

/** Unbound: the captain's stance (the blade low in the right hand). */
export const AIZEN_TYBW_STANCE: StanceDef = AIZEN_STANCE;

const seated = (over: Record<string, E> = {}): Record<string, E> => ({ ...SEATED, ...over });

export const AIZEN_TYBW_CLIPS: ClipDef[] = [
  {
    // held while bound: the seated pose with the arms out of the sword IK
    name: 'az_seated', dur: 1, fadeIn: 0.2, fadeOut: 0.2,
    keys: [
      { ...key(0, seated(), SEAT_HIPS), c: noIk },
      { ...key(1, seated(), SEAT_HIPS), c: noIk },
    ],
  },
  {
    // the glance: a slight tilt of the head toward the target, the chin dipping (pressure flicks)
    name: 'az_glance', dur: 0.5, fadeIn: 0.05, fadeOut: 0.2, events: { hit: 0.14 },
    keys: [
      { ...key(0, seated(), SEAT_HIPS), c: noIk },
      { ...key(0.14, seated({ neck: [6, 0, 0], head: [8, -6, -6] }), SEAT_HIPS, 'outExpo'), c: noIk },
      { ...key(0.5, seated(), SEAT_HIPS, 'inOut'), c: noIk },
    ],
  },
  {
    // the seated cast: the chin lifted, the shoulders back against the chair as the reiatsu climbs
    name: 'az_seat_cast', dur: 1.1, fadeIn: 0.1, fadeOut: 0.3, events: { charge: 0.05, fire: 0.4 },
    keys: [
      { ...key(0, seated(), SEAT_HIPS), c: noIk },
      { ...key(0.4, seated({ spine: [-6, 0, 0], chest: [-8, 0, 0], neck: [-8, 0, 0], head: [-10, 0, 0], 'hand.L': [0, 0, 20], 'hand.R': [0, 0, -20] }), SEAT_HIPS, 'outExpo'), c: noIk },
      { ...key(0.8, seated({ spine: [-5, 0, 0], chest: [-7, 0, 0], neck: [-6, 0, 0], head: [-8, 0, 0] }), SEAT_HIPS, 'out'), c: noIk },
      { ...key(1.1, seated(), SEAT_HIPS, 'inOut'), c: noIk },
    ],
  },
  {
    // unbound: the straps burst, he rises out of the chair, the right hand opening (the blade will come out of it)
    name: 'az_unbind', dur: 1.6, fadeIn: 0.05, fadeOut: 0.35, events: { burst: 0.3, rise: 0.55, draw: 1.05 },
    keys: [
      { ...key(0, seated(), SEAT_HIPS), c: noIk },
      { ...key(0.3, seated({ spine: [-8, 0, 0], chest: [-10, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-20, 0, 40], 'upperarm.R': [-20, 0, -40], 'forearm.L': [-40, 0, 0], 'forearm.R': [-40, 0, 0] }), [0, -0.38, -0.05], 'outExpo'), c: noIk },
      { ...key(0.8, { spine: [2, 0, 0], chest: [0, 0, 0], head: [-4, 0, 0], 'thigh.L': [-6, 0, 4], 'shin.L': [8, 0, 0], 'thigh.R': [-4, 0, -4], 'shin.R': [6, 0, 0], 'upperarm.L': [4, 0, 10], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-40, 0, -10], 'forearm.R': [-60, 0, 0], 'hand.R': [0, 0, -10] }, [0, -0.02, 0], 'inOut'), c: noIk },
      { ...key(1.05, { spine: [2, 0, 0], head: [-4, 0, 0], 'upperarm.L': [4, 0, 10], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-50, 0, -14], 'forearm.R': [-50, 0, 0], 'hand.R': [10, 0, -10] }, [0, -0.01, 0], 'out'), c: noIk },
      { t: 1.6, b: {}, ease: 'inOut', c: { '@ikR': [1, 0, 0], '@ikL': [0, 0, 0] } },
    ],
  },
  {
    // unbound: the open hand raised before him (Goryūtenmetsu, Dankū)
    name: 'az_raise', dur: 1.3, fadeIn: 0.08, fadeOut: 0.3, events: { charge: 0.05, fire: 0.45 },
    keys: [
      key(0, {}),
      key(0.45, { chest: [-4, 10, 0], head: [-6, -6, 0], 'upperarm.L': [-96, 0, 6], 'forearm.L': [-10, 0, 0], 'hand.L': [-20, 0, 0] }, [0, -0.02, 0], 'outExpo'),
      key(0.95, { chest: [-4, 10, 0], head: [-6, -6, 0], 'upperarm.L': [-92, 0, 6], 'forearm.L': [-12, 0, 0], 'hand.L': [-20, 0, 0] }, [0, -0.02, 0], 'inOut'),
      key(1.3, {}, [0, 0, 0], 'inOut'),
    ],
  },
];
