import type { StageViewer } from '../types';

export interface CharacterMotionInput {
  elapsed: number;
  phase: number;
  reacting: boolean;
  motion?: StageViewer['motion'];
  audioEnergy: number;
  musicPlaying: boolean;
  beat: number;
  giftActive: boolean;
  rank: number;
}

export interface CharacterMotionSample {
  frameRate: number;
  rootYOffset: number;
  scaleX: number;
  scaleY: number;
  leanZ: number;
  pitchX: number;
  labelLift: number;
  shadowScale: number;
  shadowOpacity: number;
  auraScale: number;
  auraOpacity: number;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

/**
 * Converts stage energy + viewer reaction state into a small procedural pose.
 * Keeping the math outside Three.js makes the visual behavior deterministic,
 * testable and reusable if sprites are replaced with rigged GLB characters.
 */
export function sampleCharacterMotion(input: CharacterMotionInput): CharacterMotionSample {
  const energy = clamp01(input.audioEnergy);
  const danceStrength = input.musicPlaying ? 0.55 + energy * 0.45 : 0.22 + energy * 0.18;
  const phase = input.phase;
  const slow = Math.sin(input.elapsed * 2.15 + phase);
  const groove = Math.sin(input.elapsed * (4.3 + energy * 1.4) + phase * 1.7);
  const step = Math.sin(input.elapsed * (7.2 + energy * 1.8) + phase * 0.73);
  const beatKick = input.musicPlaying
    ? Math.max(0, Math.sin(input.elapsed * 6.2 + input.beat * 0.41 + phase)) * (0.012 + energy * 0.025)
    : 0;

  let jump = 0;
  let squash = 0;
  let leanBoost = 0;
  let auraOpacity = input.rank < 3 ? 0.08 + (3 - input.rank) * 0.035 : 0;

  if (input.reacting) {
    switch (input.motion) {
      case 'gift':
        jump = Math.abs(Math.sin(input.elapsed * 9.4 + phase)) * 0.18;
        squash = Math.max(0, Math.sin(input.elapsed * 12.2 + phase)) * 0.055;
        leanBoost = Math.sin(input.elapsed * 7.2 + phase) * 0.055;
        auraOpacity = Math.max(auraOpacity, 0.6);
        break;
      case 'cheer':
        jump = Math.abs(Math.sin(input.elapsed * 8.2 + phase)) * 0.14;
        squash = 0.035;
        leanBoost = Math.sin(input.elapsed * 6.4 + phase) * 0.04;
        auraOpacity = Math.max(auraOpacity, 0.42);
        break;
      case 'wave':
        jump = Math.abs(Math.sin(input.elapsed * 5.1 + phase)) * 0.07;
        leanBoost = Math.sin(input.elapsed * 8.6 + phase) * 0.075;
        auraOpacity = Math.max(auraOpacity, 0.28);
        break;
      case 'heart':
        jump = Math.abs(Math.sin(input.elapsed * 6.5 + phase)) * 0.09;
        squash = 0.025;
        auraOpacity = Math.max(auraOpacity, 0.35);
        break;
      case 'enter':
        jump = Math.abs(Math.sin(input.elapsed * 7.6 + phase)) * 0.11;
        leanBoost = Math.sin(input.elapsed * 5.8 + phase) * 0.045;
        auraOpacity = Math.max(auraOpacity, 0.3);
        break;
      default:
        jump = Math.abs(Math.sin(input.elapsed * 8.3 + phase)) * 0.1;
        squash = 0.03;
        auraOpacity = Math.max(auraOpacity, 0.3);
    }
  }

  if (input.giftActive) auraOpacity = Math.max(auraOpacity, 0.18);

  const rootYOffset = slow * 0.018 + Math.max(0, step) * 0.018 * danceStrength + beatKick + jump;
  const scaleY = 1 + slow * 0.008 + groove * 0.006 * danceStrength - squash;
  const scaleX = 1 - slow * 0.004 - groove * 0.003 * danceStrength + squash * 0.55;
  const leanZ = groove * (0.012 + danceStrength * 0.018) + leanBoost;
  const pitchX = -0.025 + Math.abs(step) * 0.018 * danceStrength - jump * 0.08;
  const airborne = clamp01(jump / 0.18);

  return {
    frameRate: 8.5 + danceStrength * 5.5 + (input.reacting ? 2.2 : 0),
    rootYOffset,
    scaleX,
    scaleY,
    leanZ,
    pitchX,
    labelLift: jump * 0.24,
    shadowScale: 1 - airborne * 0.24,
    shadowOpacity: 0.58 - airborne * 0.28,
    auraScale: 1 + Math.sin(input.elapsed * 3.1 + phase) * 0.06 + (input.reacting ? 0.09 : 0),
    auraOpacity,
  };
}
