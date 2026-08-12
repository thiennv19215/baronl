import * as THREE from 'three';
import type { BambooTeam, BambooWinner } from './bambooBattle';

export interface FighterMotionRig {
  model: THREE.Group;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftFoot: THREE.Mesh;
  rightFoot: THREE.Mesh;
}

export interface FighterMotionFrame {
  team: BambooTeam;
  elapsed: number;
  impactPulse: number;
  impactTeam?: BambooTeam;
  impactAge: number;
  velocity: number;
  position: number;
  status: 'waiting' | 'playing' | 'finished';
  winner?: BambooWinner;
  fallProgress: number;
  isFalling: boolean;
}

const damp = (current: number, target: number, factor: number): number => current + (target - current) * factor;

/**
 * Procedural pose controller for the Bamboo Battle mascots.
 * The game state stays deterministic; this layer only turns state into readable body language.
 */
export function applyFighterMotion(rig: FighterMotionRig, frame: FighterMotionFrame): void {
  const { team, elapsed, impactPulse, impactTeam, impactAge, velocity, position, status, winner, fallProgress, isFalling } = frame;
  const side = team === 'green' ? 1 : -1;
  const ownImpact = impactTeam === team ? impactPulse : 0;
  const receivedImpact = impactTeam && impactTeam !== team ? impactPulse : 0;
  const teamPressure = Math.max(-1, Math.min(1, (position / 46) * side));

  // Idle is intentionally asynchronous between the two fighters so the arena never feels mirrored or robotic.
  const phase = team === 'green' ? 0 : 1.37;
  const breath = Math.sin(elapsed * 2.15 + phase);
  const step = Math.sin(elapsed * 5.1 + phase);
  const brace = Math.max(0, -teamPressure);
  const advantage = Math.max(0, teamPressure);

  let bodyPitch = -0.18 - brace * 0.10 + advantage * 0.035;
  let bodyRoll = step * 0.012;
  let bodyY = breath * 0.035;
  let bodyScaleY = 1 + breath * 0.012;
  let bodyScaleX = 1 - breath * 0.006;

  // A push has anticipation -> compression -> extension -> recover instead of a single position jump.
  if (ownImpact > 0) {
    const anticipation = impactAge < 0.16 ? Math.sin((impactAge / 0.16) * Math.PI) : 0;
    const drive = impactAge >= 0.12 && impactAge < 0.62
      ? Math.sin(Math.min(1, (impactAge - 0.12) / 0.5) * Math.PI)
      : 0;
    bodyPitch -= anticipation * 0.12;
    bodyPitch -= drive * (0.16 + ownImpact * 0.035);
    bodyY -= anticipation * 0.06;
    bodyScaleY -= anticipation * 0.035;
    bodyScaleX += anticipation * 0.025;
  }

  // The receiving fighter visibly absorbs force before recovering.
  if (receivedImpact > 0) {
    const recoil = Math.max(0, Math.sin(Math.min(1, impactAge / 0.48) * Math.PI));
    bodyPitch += recoil * (0.12 + receivedImpact * 0.045);
    bodyRoll += side * recoil * 0.045;
    bodyY -= recoil * 0.04;
    bodyScaleY -= recoil * 0.025;
    bodyScaleX += recoil * 0.018;
  }

  // Foot cadence reacts to movement velocity; this gives a planted shove rather than floating translation.
  const locomotion = Math.min(1, Math.abs(velocity) * 3.8 + ownImpact * 0.35 + receivedImpact * 0.22);
  const footLift = Math.max(0, step) * 0.09 * locomotion;
  const oppositeLift = Math.max(0, -step) * 0.09 * locomotion;
  rig.leftFoot.position.y = damp(rig.leftFoot.position.y, 0.32 + footLift, 0.22);
  rig.rightFoot.position.y = damp(rig.rightFoot.position.y, 0.32 + oppositeLift, 0.22);
  rig.leftFoot.rotation.z = damp(rig.leftFoot.rotation.z, -step * 0.08 * locomotion, 0.2);
  rig.rightFoot.rotation.z = damp(rig.rightFoot.rotation.z, step * 0.08 * locomotion, 0.2);

  // Arms brace against the centre obstacle and drive harder on gift impacts.
  const armDrive = Math.min(1.2, 0.24 + brace * 0.18 + ownImpact * 0.22);
  const armRecoil = receivedImpact * 0.12;
  rig.leftArm.rotation.x = damp(rig.leftArm.rotation.x, Math.PI * (0.39 + armDrive * 0.045 - armRecoil), 0.2);
  rig.rightArm.rotation.x = damp(rig.rightArm.rotation.x, Math.PI * (0.39 + armDrive * 0.045 - armRecoil), 0.2);
  rig.leftArm.rotation.z = damp(rig.leftArm.rotation.z, -0.14 - ownImpact * 0.045 + receivedImpact * 0.04, 0.2);
  rig.rightArm.rotation.z = damp(rig.rightArm.rotation.z, 0.14 + ownImpact * 0.045 - receivedImpact * 0.04, 0.2);

  // Winner gets a short victory bounce while the loser remains controlled by the physical fall sequence.
  if (status === 'finished' && winner && winner !== 'draw' && winner === team && !isFalling) {
    const celebration = Math.max(0, Math.sin((elapsed * 7.4 + phase))) * (1 - Math.min(1, fallProgress));
    bodyY += celebration * 0.16;
    bodyPitch += celebration * 0.07;
    rig.leftArm.rotation.z = damp(rig.leftArm.rotation.z, -0.8 - celebration * 0.32, 0.18);
    rig.rightArm.rotation.z = damp(rig.rightArm.rotation.z, 0.8 + celebration * 0.32, 0.18);
  }

  if (isFalling) {
    // Release the brace during KO so limbs lag behind the body instead of staying frozen in the push pose.
    rig.leftArm.rotation.z = damp(rig.leftArm.rotation.z, -0.45 - fallProgress * 0.7, 0.18);
    rig.rightArm.rotation.z = damp(rig.rightArm.rotation.z, 0.45 + fallProgress * 0.7, 0.18);
    rig.leftFoot.rotation.z = damp(rig.leftFoot.rotation.z, -0.28 - fallProgress * 0.4, 0.18);
    rig.rightFoot.rotation.z = damp(rig.rightFoot.rotation.z, 0.28 + fallProgress * 0.4, 0.18);
    bodyPitch += fallProgress * 0.2;
  }

  rig.model.rotation.x = damp(rig.model.rotation.x, bodyPitch, 0.2);
  rig.model.rotation.z = damp(rig.model.rotation.z, bodyRoll, 0.18);
  rig.model.position.y = damp(rig.model.position.y, bodyY, 0.2);
  rig.model.scale.x = damp(rig.model.scale.x, bodyScaleX, 0.18);
  rig.model.scale.y = damp(rig.model.scale.y, bodyScaleY, 0.18);
  rig.model.scale.z = damp(rig.model.scale.z, 1, 0.18);
}
