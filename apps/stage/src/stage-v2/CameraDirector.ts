import * as THREE from 'three';

export type CameraMode = 'ambient' | 'cinematic' | 'locked';

export interface CameraDirectorInput {
  elapsed: number;
  mode: CameraMode;
  focusX: number;
  interactionFocus: boolean;
  interactionFocusX: number;
  giftActive: boolean;
  beat: number;
}

export class CameraDirector {
  private readonly camera: THREE.PerspectiveCamera;
  private readonly target = new THREE.Vector3(0, 0.2, -4.8);
  private readonly cameraGoal = new THREE.Vector3(0, 6.3, 14.8);
  private readonly targetGoal = new THREE.Vector3(0, 0.2, -4.8);
  private lastBeat = -1;
  private beatKickUntil = 0;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.camera.position.copy(this.cameraGoal);
    this.camera.lookAt(this.target);
  }

  update(input: CameraDirectorInput) {
    const { elapsed, mode, focusX, interactionFocus, interactionFocusX, giftActive, beat } = input;
    if (beat !== this.lastBeat) {
      this.lastBeat = beat;
      this.beatKickUntil = elapsed + 0.22;
    }

    const beatKick = elapsed < this.beatKickUntil ? 0.16 : 0;
    const focus = THREE.MathUtils.clamp(interactionFocus ? interactionFocusX : focusX, -1, 1);

    if (interactionFocus || giftActive) {
      this.cameraGoal.set(focus * 2.5, 4.8, 10.2 - beatKick);
      this.targetGoal.set(focus * 2.2, 0.45, -2.6);
    } else if (mode === 'locked') {
      this.cameraGoal.set(0, 6.25, 14.6);
      this.targetGoal.set(0, 0.25, -4.6);
    } else if (mode === 'cinematic') {
      const orbit = Math.sin(elapsed * 0.18);
      const drift = Math.cos(elapsed * 0.13);
      this.cameraGoal.set(orbit * 2.25, 6.1 + drift * 0.42, 14.2 - beatKick);
      this.targetGoal.set(orbit * 0.5, 0.35, -4.6 + drift * 0.35);
    } else {
      const sway = Math.sin(elapsed * 0.1);
      this.cameraGoal.set(sway * 1.15, 6.25, 14.8 - beatKick);
      this.targetGoal.set(sway * 0.28, 0.3, -4.8);
    }

    this.camera.position.lerp(this.cameraGoal, interactionFocus || giftActive ? 0.075 : 0.025);
    this.target.lerp(this.targetGoal, interactionFocus || giftActive ? 0.09 : 0.035);
    this.camera.lookAt(this.target);
  }
}
