// Yammy Llargo's animation set (docs/kits/yammy.md). Sealed: a slumped, bored bulk that throws its whole weight —
// the haymaker, a left hook, the double hammer fist, the shoulder check; Bala from alternating fists; Cero from the
// mouth; Gonzui's great breath; the grab and the tear; the brace; "Buchikirero". Ira: the colossal torso on the
// animal body — giant punches, the double hammer, the tail sweep, the stomp, the mouth beams, the shield, the roar.
// The ape: its arms are its front legs — knuckle slams, the belly flop.
import type { ClipDef, KeyDef } from '../anim/clip';
import type { StanceDef } from '../anim/locomotion';
import { ICHIGO_CLIPS } from './ichigoClips';

type B = NonNullable<KeyDef['b']>;
type C3 = [number, number, number];
const body = (t: number, b: B, hips?: KeyDef['hips'], ease?: KeyDef['ease']): KeyDef => ({ t, b, hips, ease });

const SHARED = ICHIGO_CLIPS.filter((c) => ['dash', 'airstep', 'hit_heavy'].includes(c.name));

// ================================================================== sealed

const IDLE: B = {
  // slumped and bored: the shoulders rolled forward, the arms hanging wide of the lats, the head pushed forward
  hips: [0, -6, 0], spine: [10, 4, 0], chest: [6, 4, 0], neck: [8, 0, 0], head: [-10, -6, 0],
  'thigh.L': [-4, 0, 9], 'shin.L': [6, 0, 0], 'foot.L': [-2, 0, -4], 'thigh.R': [-2, 0, -9], 'shin.R': [4, 0, 0], 'foot.R': [-2, 0, 4],
  'upperarm.L': [-8, 0, 22], 'forearm.L': [-26, 0, 0], 'hand.L': [0, 0, 6],
  'upperarm.R': [-8, 0, -22], 'forearm.R': [-26, 0, 0], 'hand.R': [0, 0, -6],
};
const R = (over: B = {}): B => ({ ...IDLE, ...over });
const HIPS: C3 = [0, -0.02, 0];

export const YAMMY_STANCE: StanceDef = {
  idle: IDLE,
  idleHips: -0.03,
  run: { spine: [16, 0, 0], 'upperarm.L': [-20, 0, 26], 'upperarm.R': [-20, 0, -26], 'forearm.L': [-60, 0, 0], 'forearm.R': [-60, 0, 0] },
  sprint: { spine: [24, 0, 0], head: [-16, 0, 0], 'upperarm.L': [10, 0, 30], 'upperarm.R': [10, 0, -30] },
  swingL: 0.9,
  swingR: 0.9,
  freqScale: 0.85,
};

function strike(name: string, dur: number, at: number, wind: B, hit: B, hipsWind: C3 = HIPS, hipsHit: C3 = [0, -0.06, 0.12]): ClipDef {
  return {
    name, dur, fadeIn: 0.06, fadeOut: 0.2,
    events: { step: at * 0.6, hit: at, combo: at + 0.12 },
    keys: [
      body(0, R(), HIPS),
      body(at * 0.62, R(wind), hipsWind, 'inOut'),
      body(at, R(hit), hipsHit, 'outExpo'),
      body(at + 0.14, R(hit), hipsHit),
      body(dur, R(), HIPS, 'inOut'),
    ],
  };
}

const s1 = strike('yy_s1', 0.56, 0.24,
  { hips: [0, -30, 0], spine: [8, -14, 0], chest: [4, -20, 0], 'upperarm.R': [30, 0, -60], 'forearm.R': [-80, 0, 0], 'thigh.R': [10, 0, -10] },
  { hips: [4, 26, 0], spine: [12, 14, 0], chest: [8, 20, 0], 'upperarm.R': [-92, 0, -8], 'forearm.R': [-14, 0, 0], 'hand.R': [0, 0, 0], 'thigh.L': [-30, 0, 8], 'shin.L': [26, 0, 0], 'upperarm.L': [10, 0, 30] });
const s2 = strike('yy_s2', 0.52, 0.22,
  { hips: [0, 26, 0], chest: [4, 22, 0], 'upperarm.L': [-40, 0, 80], 'forearm.L': [-70, 0, 0] },
  { hips: [4, -24, 0], spine: [10, -12, 0], chest: [6, -22, 0], 'upperarm.L': [-88, 0, 30], 'forearm.L': [-50, 0, 0], 'thigh.R': [-26, 0, -8], 'shin.R': [24, 0, 0] });
const s3 = strike('yy_s3', 0.66, 0.32,
  { spine: [-14, 0, 0], chest: [-16, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-168, 0, 14], 'forearm.L': [-40, 0, 0], 'upperarm.R': [-168, 0, -14], 'forearm.R': [-40, 0, 0] },
  { spine: [28, 0, 0], chest: [16, 0, 0], head: [6, 0, 0], 'upperarm.L': [-70, 0, 8], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-70, 0, -8], 'forearm.R': [-20, 0, 0], 'thigh.L': [-30, 0, 10], 'shin.L': [40, 0, 0], 'thigh.R': [-30, 0, -10], 'shin.R': [40, 0, 0] },
  [0, 0.04, 0], [0, -0.16, 0.1]);
const s4 = strike('yy_s4', 0.66, 0.28,
  { hips: [8, 30, 0], spine: [10, 10, 0], chest: [10, 16, 0], 'thigh.L': [-40, 0, 10], 'shin.L': [60, 0, 0], 'thigh.R': [-20, 0, -10], 'shin.R': [40, 0, 0] },
  { hips: [14, 40, 0], spine: [16, 14, 0], chest: [12, 20, 0], 'upperarm.L': [10, 0, 10], 'forearm.L': [-30, 0, 0], 'thigh.L': [-50, 0, 8], 'shin.L': [40, 0, 0], 'thigh.R': [20, 0, -8], 'shin.R': [10, 0, 0] },
  [0, -0.12, -0.05], [0, -0.1, 0.4]);
s4.events = { step: 0.12, hit: 0.28 };

/** Bala: fists driven out in turn, a red bullet off each */
const bala: ClipDef = {
  name: 'yy_bala', dur: 0.82, fadeIn: 0.05, fadeOut: 0.18,
  events: Object.fromEntries(Array.from({ length: 6 }, (_, i) => [`b${i}`, 0.1 + i * 0.1])),
  keys: [
    body(0, R(), HIPS),
    ...Array.from({ length: 6 }, (_, i) => {
      const r = i % 2 === 0;
      return body(0.1 + i * 0.1, R({
        hips: [0, r ? 14 : -14, 0], chest: [6, r ? 16 : -16, 0],
        [r ? 'upperarm.R' : 'upperarm.L']: [-90, 0, r ? -6 : 6], [r ? 'forearm.R' : 'forearm.L']: [-6, 0, 0],
        [r ? 'upperarm.L' : 'upperarm.R']: [-30, 0, r ? 30 : -30], [r ? 'forearm.L' : 'forearm.R']: [-100, 0, 0],
      }), [0, -0.04, 0.04], 'outExpo');
    }),
    body(0.82, R(), HIPS, 'inOut'),
  ],
};

/** Cero from the mouth: the head thrust forward, the jaw dropped */
const cero: ClipDef = {
  name: 'yy_cero', dur: 1.0, fadeIn: 0.06, fadeOut: 0.22,
  events: { charge: 0.05, fire: 0.42 },
  keys: [
    body(0, R(), HIPS),
    body(0.36, R({ spine: [16, 0, 0], chest: [10, 0, 0], neck: [10, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-10, 0, 40], 'upperarm.R': [-10, 0, -40], 'thigh.L': [-24, 0, 12], 'shin.L': [30, 0, 0], 'thigh.R': [-16, 0, -12], 'shin.R': [24, 0, 0] }), [0, -0.1, 0], 'inOut'),
    body(0.46, R({ spine: [12, 0, 0], chest: [6, 0, 0], neck: [4, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-10, 0, 44], 'upperarm.R': [-10, 0, -44], 'thigh.L': [-24, 0, 12], 'shin.L': [30, 0, 0], 'thigh.R': [-16, 0, -12], 'shin.R': [24, 0, 0] }), [0, -0.1, -0.04], 'outExpo'),
    body(0.7, R({ spine: [12, 0, 0], chest: [6, 0, 0], head: [-12, 0, 0], 'upperarm.L': [-10, 0, 44], 'upperarm.R': [-10, 0, -44] }), [0, -0.08, -0.02]),
    body(1.0, R(), HIPS, 'inOut'),
  ],
};

/** Gonzui: one huge breath in — the chest heaving up, the head thrown back, the arms spread */
const gonzui: ClipDef = {
  name: 'yy_gonzui', dur: 1.7, fadeIn: 0.1, fadeOut: 0.3,
  events: { inhale: 0.25 },
  keys: [
    body(0, R(), HIPS),
    body(0.3, R({ spine: [-10, 0, 0], chest: [-14, 0, 0], neck: [-10, 0, 0], head: [-26, 0, 0], 'upperarm.L': [-10, 0, 50], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-10, 0, -50], 'forearm.R': [-20, 0, 0] }), [0, 0.03, 0], 'inOut'),
    body(1.3, R({ spine: [-12, 0, 0], chest: [-18, 0, 0], neck: [-12, 0, 0], head: [-30, 0, 0], 'upperarm.L': [-14, 0, 56], 'forearm.L': [-20, 0, 0], 'upperarm.R': [-14, 0, -56], 'forearm.R': [-20, 0, 0] }), [0, 0.04, 0]),
    body(1.7, R(), HIPS, 'inOut'),
  ],
};

/** the grab: a lunge, the right hand closing on them */
const grab: ClipDef = {
  name: 'yy_grab', dur: 0.5, fadeIn: 0.05, fadeOut: 0.2,
  events: { grab: 0.2 },
  keys: [
    body(0, R(), HIPS),
    body(0.2, R({ hips: [6, 20, 0], spine: [12, 10, 0], chest: [6, 12, 0], 'upperarm.R': [-84, 0, -6], 'forearm.R': [-10, 0, 0], 'hand.R': [0, 0, 0], 'thigh.L': [-34, 0, 8], 'shin.L': [30, 0, 0] }), [0, -0.08, 0.3], 'outExpo'),
    body(0.5, R({ hips: [4, 14, 0], spine: [8, 8, 0], 'upperarm.R': [-70, 0, -10], 'forearm.R': [-40, 0, 0] }), [0, -0.04, 0.2], 'inOut'),
  ],
};

/** the tear: the victim hoisted up by the arm, both hands on it, a wrench and a twist */
const rip: ClipDef = {
  name: 'yy_rip', dur: 0.9, fadeIn: 0.08, fadeOut: 0.25,
  events: { rip: 0.42 },
  keys: [
    body(0, R({ spine: [-4, 0, 0], 'upperarm.R': [-150, 0, -8], 'forearm.R': [-20, 0, 0] }), [0, -0.02, 0.1]),
    body(0.3, R({ hips: [0, -10, 0], spine: [-6, 0, 0], chest: [0, -14, 0], head: [-14, 0, 0], 'upperarm.R': [-152, 0, -14], 'forearm.R': [-28, 0, 0], 'upperarm.L': [-140, 0, 18], 'forearm.L': [-50, 0, 0] }), [0, -0.04, 0.08], 'inOut'),
    body(0.42, R({ hips: [0, 24, 0], chest: [-4, 28, 0], head: [-8, 10, 0], 'upperarm.R': [-70, 0, -50], 'forearm.R': [-30, 0, 0], 'upperarm.L': [-150, 0, 30], 'forearm.L': [-30, 0, 0] }), [0, -0.04, 0.05], 'outExpo'),
    body(0.9, R(), HIPS, 'inOut'),
  ],
};

/** the Hierro brace: the forearms up, the bulk lowered behind them (held) */
const brace: ClipDef = {
  name: 'yy_brace', dur: 0.3, fadeIn: 0.06, fadeOut: 0.25,
  keys: [
    body(0, R(), HIPS),
    body(0.3, R({ spine: [14, 0, 0], chest: [10, 0, 0], head: [6, 0, 0], 'upperarm.L': [-70, 0, -10], 'forearm.L': [-110, 0, 0], 'upperarm.R': [-70, 0, 10], 'forearm.R': [-110, 0, 0], 'thigh.L': [-20, 0, 12], 'shin.L': [30, 0, 0], 'thigh.R': [-20, 0, -12], 'shin.R': [30, 0, 0] }), [0, -0.12, 0], 'inOut'),
  ],
};

/** "Buchikirero, Ira!": the arms flexed out, a roar at the sky */
const release: ClipDef = {
  name: 'yy_release', dur: 1.5, fadeIn: 0.08, fadeOut: 0.3,
  events: { name: 0.25, burst: 0.7 },
  keys: [
    body(0, R(), HIPS),
    body(0.4, R({ spine: [-8, 0, 0], chest: [-14, 0, 0], neck: [-10, 0, 0], head: [-30, 0, 0], 'upperarm.L': [-60, 0, 70], 'forearm.L': [-90, 0, 0], 'upperarm.R': [-60, 0, -70], 'forearm.R': [-90, 0, 0], 'thigh.L': [-20, 0, 16], 'shin.L': [30, 0, 0], 'thigh.R': [-20, 0, -16], 'shin.R': [30, 0, 0] }), [0, -0.1, 0], 'inOut'),
    body(1.2, R({ spine: [-10, 0, 0], chest: [-16, 0, 0], neck: [-12, 0, 0], head: [-34, 0, 0], 'upperarm.L': [-64, 0, 76], 'forearm.L': [-96, 0, 0], 'upperarm.R': [-64, 0, -76], 'forearm.R': [-96, 0, 0], 'thigh.L': [-20, 0, 16], 'shin.L': [30, 0, 0], 'thigh.R': [-20, 0, -16], 'shin.R': [30, 0, 0] }), [0, -0.1, 0]),
    body(1.5, R(), HIPS, 'inOut'),
  ],
};

/** dozing on his feet: the chin on the chest, the shoulders sunk, a slow heave (held) */
const doze: ClipDef = {
  name: 'yy_doze', dur: 3.2, fadeIn: 0.8, fadeOut: 0.4, loop: true,
  keys: [
    body(0, R({ spine: [16, 0, 0], chest: [10, 0, 0], neck: [20, 0, 0], head: [16, 0, 8], 'upperarm.L': [-2, 0, 18], 'upperarm.R': [-2, 0, -18], 'forearm.L': [-12, 0, 0], 'forearm.R': [-12, 0, 0] }), [0, -0.06, 0]),
    body(1.6, R({ spine: [12, 0, 0], chest: [6, 0, 0], neck: [18, 0, 0], head: [12, 0, 8], 'upperarm.L': [-2, 0, 20], 'upperarm.R': [-2, 0, -20], 'forearm.L': [-12, 0, 0], 'forearm.R': [-12, 0, 0] }), [0, -0.04, 0], 'inOut'),
    body(3.2, R({ spine: [16, 0, 0], chest: [10, 0, 0], neck: [20, 0, 0], head: [16, 0, 8], 'upperarm.L': [-2, 0, 18], 'upperarm.R': [-2, 0, -18], 'forearm.L': [-12, 0, 0], 'forearm.R': [-12, 0, 0] }), [0, -0.06, 0], 'inOut'),
  ],
};

export const YAMMY_CHAIN = ['yy_s1', 'yy_s2', 'yy_s3', 'yy_s4'];
export const YAMMY_CLIPS: ClipDef[] = [...SHARED, s1, s2, s3, s4, bala, cero, gonzui, grab, rip, brace, release, doze];

// ================================================================== Ira (the kaiju)

const KLEGS: B = {
  'fthigh.L': [-2, 0, 0], 'fshin.L': [4, 0, 0], 'ffoot.L': [-2, 0, 0], 'fthigh.R': [2, 0, 0], 'fshin.R': [2, 0, 0], 'ffoot.R': [-2, 0, 0],
  'thigh.L': [-4, 0, 0], 'shin.L': [8, 0, 0], 'foot.L': [-4, 0, 0], 'thigh.R': [4, 0, 0], 'shin.R': [6, 0, 0], 'foot.R': [-2, 0, 0],
};
const K_IDLE: B = {
  ...KLEGS,
  spine: [6, 0, 0], chest: [6, 0, 0], neck: [6, 0, 0], head: [-8, 0, 0],
  'upperarm.L': [-10, 0, 20], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-10, 0, -20], 'forearm.R': [-30, 0, 0],
  tail1: [10, 0, 0], tail2: [10, 0, 0],
};
const K = (over: B = {}): B => ({ ...K_IDLE, ...over });

export const IRA_STANCE: StanceDef = {
  idle: K_IDLE,
  run: { spine: [12, 0, 0], 'upperarm.L': [-20, 0, 24], 'upperarm.R': [-20, 0, -24], 'forearm.L': [-60, 0, 0], 'forearm.R': [-60, 0, 0] },
  sprint: { spine: [20, 0, 0], head: [-14, 0, 0] },
  swingL: 0.5,
  swingR: 0.5,
  freqScale: 0.32,
  speedScale: 3.2,
  quad: { stride: 1, rock: 4 },
};

function kStrike(name: string, dur: number, at: number, wind: B, hit: B, extra: Record<string, number> = {}): ClipDef {
  return {
    name, dur, fadeIn: 0.08, fadeOut: 0.25,
    events: { hit: at, combo: at + 0.2, ...extra },
    keys: [
      body(0, K(), [0, 0, 0]),
      body(at * 0.6, K(wind), [0, 0, 0], 'inOut'),
      body(at, K(hit), [0, -0.1, 0.2], 'outExpo'),
      body(at + 0.2, K(hit), [0, -0.1, 0.2]),
      body(dur, K(), [0, 0, 0], 'inOut'),
    ],
  };
}
const k1 = kStrike('yi_s1', 0.95, 0.4,
  { spine: [0, -20, 0], chest: [-6, -26, 0], 'upperarm.R': [20, 0, -70], 'forearm.R': [-90, 0, 0] },
  { spine: [20, 18, 0], chest: [16, 24, 0], 'upperarm.R': [-112, 0, -6], 'forearm.R': [-6, 0, 0], 'upperarm.L': [0, 0, 30] }, { piston: 0.56 });
const k2 = kStrike('yi_s2', 0.95, 0.4,
  { spine: [0, 20, 0], chest: [-6, 26, 0], 'upperarm.L': [20, 0, 70], 'forearm.L': [-90, 0, 0] },
  { spine: [20, -18, 0], chest: [16, -24, 0], 'upperarm.L': [-112, 0, 6], 'forearm.L': [-6, 0, 0], 'upperarm.R': [0, 0, -30] }, { piston: 0.56 });
const k3 = kStrike('yi_s3', 1.15, 0.5,
  { spine: [-14, 0, 0], chest: [-16, 0, 0], head: [-14, 0, 0], 'upperarm.L': [-170, 0, 16], 'forearm.L': [-30, 0, 0], 'upperarm.R': [-170, 0, -16], 'forearm.R': [-30, 0, 0] },
  { spine: [34, 0, 0], chest: [20, 0, 0], head: [10, 0, 0], 'upperarm.L': [-80, 0, 10], 'forearm.L': [-10, 0, 0], 'upperarm.R': [-80, 0, -10], 'forearm.R': [-10, 0, 0] }, { piston: 0.66 });
/** the whole body wheeled round on the spot, the tail club sweeping the full circle (the spin wraps 360 → 0 unseen) */
const k4: ClipDef = {
  name: 'yi_s4', dur: 1.2, fadeIn: 0.08, fadeOut: 0.25,
  events: { hit: 0.5 },
  keys: [
    { ...body(0, K(), [0, 0, 0]), c: { '@spin': [0, 0, 0] } },
    { ...body(0.3, K({ hips: [0, -24, 0], spine: [4, 20, 0], tail1: [6, 40, 0], tail2: [4, 30, 0] }), [0, 0, 0], 'inOut'), c: { '@spin': [-30, 0, 0] } },
    { ...body(0.5, K({ hips: [0, 30, 0], spine: [6, -24, 0], tail1: [0, -56, 0], tail2: [0, -44, 0] }), [0, -0.05, 0], 'in'), c: { '@spin': [170, 0, 0] } },
    { ...body(0.72, K({ hips: [0, 20, 0], spine: [6, -20, 0], tail1: [0, -40, 0], tail2: [0, -30, 0] }), [0, -0.05, 0], 'out'), c: { '@spin': [360, 0, 0] } },
    { t: 0.73, c: { '@spin': [0, 0, 0] } },
    body(1.2, K(), [0, 0, 0], 'inOut'),
  ],
};
/** giant Bala: fists driven out in turn */
const kbala: ClipDef = {
  name: 'yi_bala', dur: 1.0, fadeIn: 0.06, fadeOut: 0.2,
  events: Object.fromEntries(Array.from({ length: 4 }, (_, i) => [`b${i}`, 0.18 + i * 0.16])),
  keys: [
    body(0, K(), [0, 0, 0]),
    ...Array.from({ length: 4 }, (_, i) => {
      const r = i % 2 === 0;
      return body(0.18 + i * 0.16, K({ chest: [8, r ? 18 : -18, 0], [r ? 'upperarm.R' : 'upperarm.L']: [-92, 0, r ? -4 : 4], [r ? 'forearm.R' : 'forearm.L']: [-4, 0, 0] }), [0, 0, 0.1], 'outExpo');
    }),
    body(1.0, K(), [0, 0, 0], 'inOut'),
  ],
};
/** the giant Cero: the head down, the mouth open, swept across */
const kcero: ClipDef = {
  name: 'yi_cero', dur: 1.9, fadeIn: 0.08, fadeOut: 0.3,
  events: { charge: 0.05, fire: 0.66 },
  keys: [
    body(0, K(), [0, 0, 0]),
    body(0.6, K({ spine: [16, -24, 0], chest: [10, -10, 0], neck: [12, 0, 0], head: [-4, 0, 0] }), [0, -0.1, 0], 'inOut'),
    body(1.5, K({ spine: [16, 24, 0], chest: [10, 10, 0], neck: [12, 0, 0], head: [-4, 0, 0] }), [0, -0.1, 0], 'inOut'),
    body(1.9, K(), [0, 0, 0], 'inOut'),
  ],
};
/** Cero Oscuras: the head thrown back as the black orb swells before his mouth, then the beam */
const koscuras: ClipDef = {
  name: 'yi_oscuras', dur: 2.3, fadeIn: 0.08, fadeOut: 0.3,
  events: { charge: 0.05, fire: 1.5 },
  keys: [
    body(0, K(), [0, 0, 0]),
    body(0.5, K({ spine: [-6, 0, 0], chest: [-10, 0, 0], neck: [-6, 0, 0], head: [-16, 0, 0], 'upperarm.L': [-20, 0, 50], 'upperarm.R': [-20, 0, -50] }), [0, 0, 0], 'inOut'),
    body(1.4, K({ spine: [-8, 0, 0], chest: [-12, 0, 0], neck: [-8, 0, 0], head: [-20, 0, 0], 'upperarm.L': [-20, 0, 56], 'upperarm.R': [-20, 0, -56] }), [0, 0, 0]),
    body(1.55, K({ spine: [18, 0, 0], chest: [10, 0, 0], neck: [10, 0, 0], head: [-6, 0, 0], 'upperarm.L': [-10, 0, 40], 'upperarm.R': [-10, 0, -40] }), [0, -0.1, 0], 'outExpo'),
    body(2.3, K(), [0, 0, 0], 'inOut'),
  ],
};
/** the stomp: the front legs rear and come down */
const kstomp: ClipDef = {
  name: 'yi_stomp', dur: 1.2, fadeIn: 0.08, fadeOut: 0.25,
  events: { stomp: 0.62 },
  keys: [
    body(0, K(), [0, 0, 0]),
    body(0.45, K({ hips: [-22, 0, 0], spine: [-10, 0, 0], 'fthigh.L': [-50, 0, 0], 'fshin.L': [60, 0, 0], 'fthigh.R': [-50, 0, 0], 'fshin.R': [60, 0, 0], 'thigh.L': [20, 0, 0], 'thigh.R': [20, 0, 0] }), [0, 0.6, 0], 'inOut'),
    body(0.62, K({ hips: [4, 0, 0], spine: [16, 0, 0], 'fthigh.L': [6, 0, 0], 'fthigh.R': [6, 0, 0] }), [0, -0.2, 0], 'outExpo'),
    body(1.2, K(), [0, 0, 0], 'inOut'),
  ],
};
/** the shield: the arms crossed before him (held) */
const kshield: ClipDef = {
  name: 'yi_shield', dur: 0.4, fadeIn: 0.08, fadeOut: 0.3,
  keys: [
    body(0, K(), [0, 0, 0]),
    body(0.4, K({ spine: [10, 0, 0], chest: [8, 0, 0], head: [8, 0, 0], 'upperarm.L': [-80, 0, -20], 'forearm.L': [-100, 0, 0], 'upperarm.R': [-80, 0, 20], 'forearm.R': [-100, 0, 0] }), [0, -0.1, 0], 'inOut'),
  ],
};
/** the roar (the release's end, the evolution) */
const kroar: ClipDef = {
  name: 'yi_roar', dur: 1.6, fadeIn: 0.1, fadeOut: 0.3,
  events: { roar: 0.4 },
  keys: [
    body(0, K(), [0, 0, 0]),
    body(0.5, K({ spine: [-10, 0, 0], chest: [-16, 0, 0], neck: [-10, 0, 0], head: [-28, 0, 0], 'upperarm.L': [-50, 0, 80], 'forearm.L': [-80, 0, 0], 'upperarm.R': [-50, 0, -80], 'forearm.R': [-80, 0, 0] }), [0, 0.1, 0], 'inOut'),
    body(1.3, K({ spine: [-12, 0, 0], chest: [-18, 0, 0], neck: [-12, 0, 0], head: [-32, 0, 0], 'upperarm.L': [-54, 0, 84], 'forearm.L': [-84, 0, 0], 'upperarm.R': [-54, 0, -84], 'forearm.R': [-84, 0, 0] }), [0, 0.1, 0]),
    body(1.6, K(), [0, 0, 0], 'inOut'),
  ],
};

export const IRA_CHAIN = ['yi_s1', 'yi_s2', 'yi_s3', 'yi_s4'];
export const IRA_CLIPS: ClipDef[] = [...SHARED, k1, k2, k3, k4, kbala, kcero, koscuras, kstomp, kshield, kroar];

// ================================================================== the ape

const A_IDLE: B = {
  hips: [10, 0, 0], spine: [10, 0, 0], chest: [6, 0, 0], neck: [-10, 0, 0], head: [-14, 0, 0],
  'fthigh.L': [-4, 0, 4], 'fshin.L': [6, 0, 0], 'fthigh.R': [-4, 0, -4], 'fshin.R': [6, 0, 0],
  'thigh.L': [-20, 0, 6], 'shin.L': [26, 0, 0], 'foot.L': [-6, 0, 0], 'thigh.R': [-20, 0, -6], 'shin.R': [26, 0, 0], 'foot.R': [-6, 0, 0],
  tail1: [20, 0, 0], tail2: [16, 0, 0],
};
const A = (over: B = {}): B => ({ ...A_IDLE, ...over });

export const APE_STANCE: StanceDef = {
  idle: A_IDLE,
  run: { chest: [10, 0, 0] },
  sprint: { chest: [16, 0, 0], head: [-20, 0, 0] },
  freqScale: 0.3,
  speedScale: 3.6,
  quad: { stride: 1.1, rock: 6 },
};

function slam(name: string, sides: ('L' | 'R')[], dur: number, at: number): ClipDef {
  const up: B = {}, down: B = {};
  for (const s of sides) {
    up[`fthigh.${s}`] = [-130, 0, s === 'L' ? 14 : -14];
    up[`fshin.${s}`] = [-20, 0, 0];
    // the fist comes down well out in front of him
    down[`fthigh.${s}`] = [-34, 0, s === 'L' ? 6 : -6];
    down[`fshin.${s}`] = [-6, 0, 0];
  }
  return {
    name, dur, fadeIn: 0.08, fadeOut: 0.25,
    events: { hit: at, combo: at + 0.2 },
    keys: [
      body(0, A(), [0, 0, 0]),
      body(at * 0.62, A({ ...up, chest: [-10, 0, 0], spine: [-6, 0, 0], head: [-20, 0, 0] }), [0, 0.3, 0], 'inOut'),
      body(at, A({ ...down, chest: [16, 0, 0], spine: [12, 0, 0] }), [0, -0.2, 0.3], 'outExpo'),
      body(dur, A(), [0, 0, 0], 'inOut'),
    ],
  };
}
const a1 = slam('ya_s1', ['R'], 0.9, 0.42);
const a2 = slam('ya_s2', ['L'], 0.9, 0.42);
const a3 = slam('ya_s3', ['L', 'R'], 1.1, 0.5);
/** the belly flop: up on the hind legs and down on the whole belly */
const a4: ClipDef = {
  name: 'ya_s4', dur: 1.4, fadeIn: 0.08, fadeOut: 0.3,
  events: { hit: 0.75 },
  keys: [
    body(0, A(), [0, 0, 0]),
    body(0.5, A({ hips: [-30, 0, 0], spine: [-10, 0, 0], 'fthigh.L': [-150, 0, 20], 'fthigh.R': [-150, 0, -20], 'thigh.L': [10, 0, 6], 'thigh.R': [10, 0, -6] }), [0, 1.4, 0], 'inOut'),
    body(0.75, A({ hips: [24, 0, 0], spine: [16, 0, 0], 'fthigh.L': [-60, 0, 40], 'fthigh.R': [-60, 0, -40] }), [0, -0.6, 0.6], 'outExpo'),
    body(1.4, A(), [0, 0, 0], 'inOut'),
  ],
};
/** Bala and Cero on all fours: the head thrust out */
const acero: ClipDef = {
  name: 'ya_cero', dur: 1.6, fadeIn: 0.08, fadeOut: 0.3,
  events: { charge: 0.05, fire: 0.6 },
  keys: [
    body(0, A(), [0, 0, 0]),
    body(0.55, A({ chest: [-6, -20, 0], neck: [-20, 0, 0], head: [-10, 0, 0] }), [0, 0.2, 0], 'inOut'),
    body(1.3, A({ chest: [-6, 20, 0], neck: [-20, 0, 0], head: [-10, 0, 0] }), [0, 0.2, 0], 'inOut'),
    body(1.6, A(), [0, 0, 0], 'inOut'),
  ],
};
const aroar: ClipDef = {
  name: 'ya_roar', dur: 1.6, fadeIn: 0.1, fadeOut: 0.3,
  events: { roar: 0.4 },
  keys: [
    body(0, A(), [0, 0, 0]),
    body(0.5, A({ hips: [-30, 0, 0], chest: [-20, 0, 0], neck: [-20, 0, 0], head: [-30, 0, 0], 'fthigh.L': [-120, 0, 40], 'fthigh.R': [-120, 0, -40] }), [0, 1.2, 0], 'inOut'),
    body(1.2, A({ hips: [-32, 0, 0], chest: [-22, 0, 0], neck: [-20, 0, 0], head: [-34, 0, 0], 'fthigh.L': [-130, 0, 44], 'fthigh.R': [-130, 0, -44] }), [0, 1.2, 0]),
    body(1.6, A(), [0, 0, 0], 'inOut'),
  ],
};

/** giant Bala on all fours: the fists driven forward in turn off the ground */
const abala: ClipDef = {
  name: 'ya_bala', dur: 1.0, fadeIn: 0.06, fadeOut: 0.2,
  events: Object.fromEntries(Array.from({ length: 4 }, (_, i) => [`b${i}`, 0.18 + i * 0.16])),
  keys: [
    body(0, A(), [0, 0, 0]),
    ...Array.from({ length: 4 }, (_, i) => {
      const r = i % 2 === 0, s = r ? 'R' : 'L';
      return body(0.18 + i * 0.16, A({ chest: [0, r ? 16 : -16, 0], [`fthigh.${s}`]: [-82, 0, r ? -6 : 6], [`fshin.${s}`]: [-6, 0, 0] }), [0, 0.2, 0.1], 'outExpo');
    }),
    body(1.0, A(), [0, 0, 0], 'inOut'),
  ],
};
/** Cero Oscuras on all fours: reared back on the haunches, the head up as the orb swells, then thrust down */
const aoscuras: ClipDef = {
  name: 'ya_oscuras', dur: 2.3, fadeIn: 0.08, fadeOut: 0.3,
  events: { charge: 0.05, fire: 1.5 },
  keys: [
    body(0, A(), [0, 0, 0]),
    body(0.5, A({ hips: [-14, 0, 0], chest: [-10, 0, 0], neck: [-24, 0, 0], head: [-24, 0, 0], 'fthigh.L': [-30, 0, 20], 'fthigh.R': [-30, 0, -20] }), [0, 0.6, 0], 'inOut'),
    body(1.4, A({ hips: [-16, 0, 0], chest: [-12, 0, 0], neck: [-26, 0, 0], head: [-28, 0, 0], 'fthigh.L': [-34, 0, 22], 'fthigh.R': [-34, 0, -22] }), [0, 0.6, 0]),
    body(1.55, A({ chest: [10, 0, 0], neck: [-12, 0, 0], head: [-8, 0, 0] }), [0, -0.1, 0.2], 'outExpo'),
    body(2.3, A(), [0, 0, 0], 'inOut'),
  ],
};
/** the ground pound: up on the hind legs, both fists hammered down */
const astomp: ClipDef = {
  name: 'ya_stomp', dur: 1.3, fadeIn: 0.08, fadeOut: 0.25,
  events: { stomp: 0.68 },
  keys: [
    body(0, A(), [0, 0, 0]),
    body(0.5, A({ hips: [-34, 0, 0], spine: [-10, 0, 0], chest: [-10, 0, 0], 'fthigh.L': [-160, 0, 16], 'fshin.L': [-30, 0, 0], 'fthigh.R': [-160, 0, -16], 'fshin.R': [-30, 0, 0] }), [0, 1.6, 0], 'inOut'),
    body(0.68, A({ hips: [16, 0, 0], spine: [14, 0, 0], chest: [10, 0, 0], 'fthigh.L': [4, 0, 8], 'fthigh.R': [4, 0, -8] }), [0, -0.3, 0.4], 'outExpo'),
    body(1.3, A(), [0, 0, 0], 'inOut'),
  ],
};
/** the shield: the arms crossed before the chest (held) */
const ashield: ClipDef = {
  name: 'ya_shield', dur: 0.4, fadeIn: 0.08, fadeOut: 0.3,
  keys: [
    body(0, A(), [0, 0, 0]),
    body(0.4, A({ hips: [-20, 0, 0], chest: [-6, 0, 0], head: [10, 0, 0], 'fthigh.L': [-70, 0, -34], 'fshin.L': [-40, 0, 0], 'fthigh.R': [-70, 0, 34], 'fshin.R': [-40, 0, 0] }), [0, 0.8, 0], 'inOut'),
  ],
};

export const APE_CHAIN = ['ya_s1', 'ya_s2', 'ya_s3', 'ya_s4'];
export const APE_CLIPS: ClipDef[] = [...SHARED, a1, a2, a3, a4, acero, aroar, abala, aoscuras, astomp, ashield];
