import * as THREE from 'three';
import type { BambooBattleState, BambooTeam } from './bambooBattle';

export interface BambooCameraInput {
  elapsed: number;
  currentX: number;
  velocity: number;
  tremor: number;
  impactAge: number;
  impactStrength: number;
  impactTeam: BambooTeam;
  status: BambooBattleState['status'];
  winner?: BambooBattleState['winner'];
  fallProgress: number;
  fallingTeam?: BambooTeam;
}

export interface BambooCameraDirector {
  update(input: BambooCameraInput): void;
  resize(width: number, height: number): void;
}

const damp = (current: number, target: number, smoothing: number): number => current + (target - current) * smoothing;
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export function createBambooCameraDirector(camera: THREE.PerspectiveCamera): BambooCameraDirector {
  const lookTarget = new THREE.Vector3(0, 1.6, 0);
  let desiredLookX = 0;
  let desiredLookY = 1.6;
  let desiredX = 0;
  let desiredY = 7.2;
  let desiredZ = 20.5;

  const resize = (width: number, height: number) => {
    const aspect = Math.max(0.45, Math.min(1.15, width / Math.max(1, height)));
    camera.aspect = aspect;
    camera.fov = aspect < 0.62 ? 48 : 44;
    camera.updateProjectionMatrix();
  };

  const update = (input: BambooCameraInput) => {
    const pressure = clamp(Math.abs(input.currentX) / 2.5, 0, 1);
    const activeImpact = input.impactAge >= 0 && input.impactAge < 1.15;
    const impactEnvelope = activeImpact ? Math.sin(Math.min(1, input.impactAge / 0.32) * Math.PI) * Math.exp(-input.impactAge * 1.55) : 0;
    const impactDirection = input.impactTeam === 'green' ? 1 : -1;

    desiredX = clamp(input.currentX * 0.26, -0.72, 0.72);
    desiredY = 7.15 - pressure * 0.18;
    desiredZ = 20.6 - pressure * 0.55;
    desiredLookX = clamp(input.currentX * 0.22, -0.66, 0.66);
    desiredLookY = 1.62;

    if (activeImpact) {
      desiredX += impactDirection * impactEnvelope * 0.12 * input.impactStrength;
      desiredZ -= impactEnvelope * 0.42 * input.impactStrength;
      desiredLookX += impactDirection * impactEnvelope * 0.16;
    }

    if (input.status === 'finished' && input.winner && input.winner !== 'draw') {
      const winnerDirection = input.winner === 'green' ? -1 : 1;
      const reveal = clamp(input.fallProgress, 0, 1);
      desiredX = damp(desiredX, winnerDirection * 0.52, reveal * 0.35);
      desiredY = 7.0 + reveal * 0.16;
      desiredZ = 20.0 - reveal * 0.55;
      desiredLookX = damp(desiredLookX, input.currentX * 0.16, 0.45);
      desiredLookY = 1.45 - reveal * 0.12;
    }

    const shake = clamp(input.tremor * 0.025, -0.055, 0.055);
    camera.position.x = damp(camera.position.x, desiredX + shake, 0.065);
    camera.position.y = damp(camera.position.y, desiredY, 0.055);
    camera.position.z = damp(camera.position.z, desiredZ, 0.055);

    lookTarget.x = damp(lookTarget.x, desiredLookX + shake * 0.35, 0.075);
    lookTarget.y = damp(lookTarget.y, desiredLookY, 0.07);
    lookTarget.z = 0;
    camera.lookAt(lookTarget);
  };

  return { update, resize };
}
