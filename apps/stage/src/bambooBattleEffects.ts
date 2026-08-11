export type BambooBattleSkill = 'join' | 'pulse' | 'jab' | 'combo' | 'heavy' | 'ultimate';

export interface BambooSkillProfile {
  durationMs: number;
  dash: number;
  recoil: number;
  shake: number;
  hits: number;
}

export const BAMBOO_EFFECT_QUEUE_LIMIT = 12;

export const BAMBOO_SKILL_PROFILES: Record<BambooBattleSkill, BambooSkillProfile> = {
  join: { durationMs: 650, dash: 0, recoil: 0, shake: 0.03, hits: 0 },
  pulse: { durationMs: 520, dash: 0.08, recoil: 0.04, shake: 0.04, hits: 0 },
  jab: { durationMs: 720, dash: 0.55, recoil: 0.18, shake: 0.08, hits: 1 },
  combo: { durationMs: 1_080, dash: 0.78, recoil: 0.3, shake: 0.14, hits: 3 },
  heavy: { durationMs: 1_420, dash: 1.02, recoil: 0.46, shake: 0.24, hits: 1 },
  ultimate: { durationMs: 2_200, dash: 1.3, recoil: 0.78, shake: 0.42, hits: 1 },
};

export function resolveGiftSkill(totalDiamonds: number): BambooBattleSkill {
  if (totalDiamonds >= 1_000) return 'ultimate';
  if (totalDiamonds >= 100) return 'heavy';
  if (totalDiamonds >= 10) return 'combo';
  return 'jab';
}

export function skillLabel(skill: BambooBattleSkill): string {
  switch (skill) {
    case 'ultimate': return 'ULTIMATE!';
    case 'heavy': return 'HEAVY ATTACK!';
    case 'combo': return 'COMBO!';
    case 'jab': return 'TẤN CÔNG!';
    case 'pulse': return 'TĂNG LỰC!';
    default: return 'VÀO TRẬN!';
  }
}
