import { describe, expect, it } from 'vitest';
import { sampleCharacterMotion } from './CharacterMotion';

const base = {
  elapsed: 1.25,
  phase: 0.4,
  reacting: false,
  audioEnergy: 0.35,
  musicPlaying: true,
  beat: 4,
  giftActive: false,
  rank: 8,
} as const;

describe('sampleCharacterMotion', () => {
  it('keeps passive dance motion subtle and grounded', () => {
    const frame = sampleCharacterMotion(base);
    expect(Math.abs(frame.rootYOffset)).toBeLessThan(0.08);
    expect(frame.shadowOpacity).toBeGreaterThan(0.45);
    expect(frame.frameRate).toBeGreaterThan(8);
  });

  it('makes gift reactions more visible without detaching the shadow', () => {
    const passive = sampleCharacterMotion(base);
    const gift = sampleCharacterMotion({ ...base, reacting: true, motion: 'gift' });
    expect(gift.auraOpacity).toBeGreaterThan(passive.auraOpacity);
    expect(gift.rootYOffset).toBeGreaterThan(passive.rootYOffset);
    expect(gift.shadowOpacity).toBeGreaterThanOrEqual(0.25);
  });

  it('gives top-ranked viewers a persistent low-intensity presence ring', () => {
    const regular = sampleCharacterMotion(base);
    const leader = sampleCharacterMotion({ ...base, rank: 0 });
    expect(leader.auraOpacity).toBeGreaterThan(regular.auraOpacity);
  });
});
