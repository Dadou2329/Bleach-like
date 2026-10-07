// Arm IK for weapon animation: clips key where the grip is (in chest space) and where the blade
// points; the solver places the hand, bends the elbow as a hinge toward a pole and orients the wrist.
import * as THREE from 'three';
import type { Rig } from './rig';

const _S = new THREE.Vector3();
const _W = new THREE.Vector3();
const _D = new THREE.Vector3();
const _P = new THREE.Vector3();
const _E = new THREE.Vector3();
const _a1 = new THREE.Vector3();
const _a2 = new THREE.Vector3();
const _x = new THREE.Vector3();
const _y = new THREE.Vector3();
const _z = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _q1 = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _qh = new THREE.Quaternion();
const _qp = new THREE.Quaternion();
const _tmp = new THREE.Vector3();

export interface ArmChain {
  upper: number;
  fore: number;
  hand: number;
  l1: number;
  l2: number;
  /** grip point relative to the hand pivot, in hand space (m) */
  grip: THREE.Vector3;
}

export function armChain(rig: Rig, side: 'L' | 'R', gripSocket: string, pair = ''): ArmChain | null {
  const upper = rig.index(`upperarm${pair}.${side}`), fore = rig.index(`forearm${pair}.${side}`), hand = rig.index(`hand${pair}.${side}`);
  if (upper < 0 || fore < 0 || hand < 0) return null;
  const sock = rig.sockets.get(gripSocket);
  const grip = new THREE.Vector3();
  if (sock) {
    // socket lives on fist.* (child of hand.* at the same pivot)
    grip.copy(sock.position);
  }
  return { upper, fore, hand, l1: rig.restPos[fore].length(), l2: rig.restPos[hand].length(), grip };
}

/** Orientation whose +Z is `dir` and whose −Y faces `edge` (sword frame). */
export function swordQuat(dir: THREE.Vector3, edge: THREE.Vector3, out: THREE.Quaternion): THREE.Quaternion {
  _z.copy(dir).normalize();
  _y.copy(edge).multiplyScalar(-1);
  _y.addScaledVector(_z, -_y.dot(_z));
  if (_y.lengthSq() < 1e-8) _y.set(0, 1, 0).addScaledVector(_z, -_z.y);
  _y.normalize();
  _x.crossVectors(_y, _z).normalize();
  _m.makeBasis(_x, _y, _z);
  return out.setFromRotationMatrix(_m);
}

/**
 * Solve one arm so the weapon grip reaches `gripW` (world) with world orientation `handQ`.
 * `pole` (world direction) is where the elbow should point. Blends into the current bone rotations by w.
 * Bones' world matrices must be current for the chain's parents.
 */
export function solveArm(rig: Rig, c: ArmChain, gripW: THREE.Vector3, handQ: THREE.Quaternion | null, pole: THREE.Vector3, w = 1, hinge = 1): void {
  if (w <= 0) return;
  const bones = rig.bones;
  const upper = bones[c.upper], fore = bones[c.fore], hand = bones[c.hand];
  upper.getWorldPosition(_S);
  // wrist position = grip − handQ · gripOffset
  if (handQ) {
    _tmp.copy(c.grip).applyQuaternion(handQ);
    _W.copy(gripW).sub(_tmp);
  } else _W.copy(gripW);
  // keep the end bone's world rotation if no target orientation is given (feet)
  if (!handQ) hand.getWorldQuaternion(_qh);
  _D.subVectors(_W, _S);
  let d = _D.length();
  if (d < 1e-5) return;
  _D.divideScalar(d);
  d = Math.min(c.l1 + c.l2 - 1e-4, Math.max(Math.abs(c.l1 - c.l2) + 1e-4, d));
  const cosA = (c.l1 * c.l1 + d * d - c.l2 * c.l2) / (2 * c.l1 * d);
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  _P.copy(pole).addScaledVector(_D, -pole.dot(_D));
  if (_P.lengthSq() < 1e-8) _P.set(0, -1, 0).addScaledVector(_D, _D.y);
  _P.normalize();
  _E.copy(_S).addScaledVector(_D, c.l1 * cosA).addScaledVector(_P, c.l1 * sinA);
  _a1.subVectors(_E, _S).normalize();
  _a2.copy(_S).addScaledVector(_D, d).sub(_E).normalize();
  // hinge axis (bone local X) shared by upper & fore; robust when straight
  _x.copy(_a2).addScaledVector(_P, -0.02).cross(_a1).multiplyScalar(hinge).normalize();
  // upper arm world frame: Y = −a1
  _y.copy(_a1).multiplyScalar(-1);
  _z.crossVectors(_x, _y).normalize();
  _m.makeBasis(_x, _y, _z);
  _q1.setFromRotationMatrix(_m);
  // forearm world frame: Y = −a2
  _y.copy(_a2).multiplyScalar(-1);
  _z.crossVectors(_x, _y).normalize();
  _m.makeBasis(_x, _y, _z);
  _q2.setFromRotationMatrix(_m);
  // locals
  upper.parent!.getWorldQuaternion(_qp);
  const lu = _qp.clone().invert().multiply(_q1);
  const lf = _q1.clone().invert().multiply(_q2);
  const lh = _q2.clone().invert().multiply(handQ ?? _qh);
  if (w >= 1) {
    upper.quaternion.copy(lu);
    fore.quaternion.copy(lf);
    hand.quaternion.copy(lh);
  } else {
    upper.quaternion.slerp(lu, w);
    fore.quaternion.slerp(lf, w);
    hand.quaternion.slerp(lh, w);
  }
  upper.updateMatrixWorld(true);
}

/** Aim a bone chain (neck/head) toward a world point by distributing yaw/pitch, clamped. */
export function lookAt(rig: Rig, bones: number[], weights: number[], target: THREE.Vector3, maxYaw = 1.1, maxPitch = 0.7, w = 1): void {
  if (w <= 0) return;
  const head = rig.bones[bones[bones.length - 1]];
  head.updateMatrixWorld(true);
  head.getWorldPosition(_S);
  _D.subVectors(target, _S);
  if (_D.lengthSq() < 1e-6) return;
  // express in the root's frame (character space)
  rig.object.getWorldQuaternion(_qp);
  _D.applyQuaternion(_qp.invert()).normalize();
  const yaw = Math.max(-maxYaw, Math.min(maxYaw, Math.atan2(_D.x, _D.z)));
  const pitch = Math.max(-maxPitch, Math.min(maxPitch, -Math.asin(Math.max(-1, Math.min(1, _D.y)))));
  for (let i = 0; i < bones.length; i++) {
    const b = rig.bones[bones[i]];
    _q1.setFromEuler(new THREE.Euler(pitch * weights[i] * w, yaw * weights[i] * w, 0, 'YXZ'));
    b.quaternion.premultiply(_q1);
  }
  rig.bones[bones[0]].updateMatrixWorld(true);
}

export interface LegChain {
  thigh: number;
  shin: number;
  foot: number;
  l1: number;
  l2: number;
  grip: THREE.Vector3;
  /** ankle height above the sole (m) */
  ankleH: number;
  /** the same chain in solveArm's terms */
  arm: ArmChain;
}

/** A leg (thigh → shin → foot); `prefix` names another pair (a centaur's front legs: 'fthigh.L' …). */
export function legChain(rig: Rig, side: 'L' | 'R', prefix = ''): LegChain | null {
  const thigh = rig.index(`${prefix}thigh.${side}`), shin = rig.index(`${prefix}shin.${side}`), foot = rig.index(`${prefix}foot.${side}`);
  if (thigh < 0 || shin < 0 || foot < 0) return null;
  const fw = new THREE.Vector3();
  rig.bones[foot].getWorldPosition(fw);
  rig.object.worldToLocal(fw);
  const l1 = rig.restPos[shin].length(), l2 = rig.restPos[foot].length();
  return { thigh, shin, foot, l1, l2, grip: new THREE.Vector3(), ankleH: fw.y, arm: { upper: thigh, fore: shin, hand: foot, l1, l2, grip: new THREE.Vector3() } };
}

const _A = new THREE.Vector3();
const _K = new THREE.Vector3();
/**
 * Foot planting: keep the ankle at or above the ground (character-local y = 0); when the FK ankle is
 * within `snap` metres above the ground and `plant` > 0, pull it down onto the ground.
 */
export function plantLeg(rig: Rig, c: LegChain, plant: number, snap = 0.06, groundY = 0): void {
  const foot = rig.bones[c.foot];
  foot.getWorldPosition(_A);
  rig.object.worldToLocal(_A);
  const target = groundY + c.ankleH;
  let y = _A.y;
  if (y < target) y = target;
  else if (plant > 0 && y < target + snap) y = y + (target - y) * plant;
  if (Math.abs(y - _A.y) < 1e-4) return;
  _A.y = y;
  rig.object.localToWorld(_A);
  // knee pole: forward of the current knee
  rig.bones[c.shin].getWorldPosition(_K);
  rig.bones[c.thigh].getWorldPosition(_S);
  const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(rig.object.getWorldQuaternion(_qp));
  const pole = _K.sub(_S).normalize().multiplyScalar(0.3).add(fwd).normalize();
  solveArm(rig, c.arm, _A, null, pole, 1, -1);
}
