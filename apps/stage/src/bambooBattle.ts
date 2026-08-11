import { normalizeEnvelope } from './stageState';
import type { StageEventEnvelope } from './types';
import { BAMBOO_EFFECT_QUEUE_LIMIT, resolveGiftSkill, type BambooBattleSkill } from './bambooBattleEffects';

export type BambooTeam = 'green' | 'orange';
export type BambooWinner = BambooTeam | 'draw';

export interface BambooPlayer {
  id: string;
  name: string;
  avatar?: string;
  team: BambooTeam;
  contribution: number;
  likes: number;
  gifts: number;
  joinedAt: number;
}

export interface BambooBattleSettings {
  roundSeconds: number;
  autoRestart: boolean;
  likePower: number;
  giftPower: number;
}

export interface BambooBattleEffect {
  id: string;
  team: BambooTeam;
  kind: 'join' | 'like' | 'gift';
  skill: BambooBattleSkill;
  name: string;
  label: string;
  power: number;
  diamonds: number;
  at: number;
}

export interface BambooBattleState {
  status: 'waiting' | 'playing' | 'finished';
  round: number;
  startedAt: number;
  endsAt: number;
  remainingMs: number;
  nextRoundAt?: number;
  position: number;
  winner?: BambooWinner;
  players: Record<string, BambooPlayer>;
  teams: Record<BambooTeam, { power: number; likes: number; gifts: number }>;
  impact?: BambooBattleEffect;
  effects: BambooBattleEffect[];
  settings: BambooBattleSettings;
}

export type BambooBattleAction =
  | { type: 'configure'; settings: Partial<BambooBattleSettings> }
  | { type: 'start'; now: number }
  | { type: 'tick'; now: number }
  | { type: 'event'; event: StageEventEnvelope };

const defaultSettings: BambooBattleSettings = { roundSeconds: 60, autoRestart: true, likePower: 0.08, giftPower: 0.8 };
const emptyTeams = (): BambooBattleState['teams'] => ({ green: { power: 0, likes: 0, gifts: 0 }, orange: { power: 0, likes: 0, gifts: 0 } });
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const tugPosition = (greenPower: number, orangePower: number): number => {
  const total = greenPower + orangePower;
  return clamp(((greenPower - orangePower) / (total + 8)) * 46, -46, 46);
};
const numberValue = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const stringValue = (value: unknown, fallback = ''): string => typeof value === 'string' ? value : value == null ? fallback : String(value);
const safeId = (value: string): string => value.trim().toLowerCase().replace(/[^a-z0-9_.-]+/g, '-') || 'guest';

export function createInitialBambooState(): BambooBattleState {
  return { status: 'waiting', round: 0, startedAt: 0, endsAt: 0, remainingMs: defaultSettings.roundSeconds * 1_000, position: 0, players: {}, teams: emptyTeams(), effects: [], settings: { ...defaultSettings } };
}

function beginRound(state: BambooBattleState, now: number): BambooBattleState {
  const duration = clamp(Math.round(state.settings.roundSeconds), 30, 300) * 1_000;
  return { ...state, status: 'playing', round: state.round + 1, startedAt: now, endsAt: now + duration, remainingMs: duration, nextRoundAt: undefined, position: 0, winner: undefined, players: {}, teams: emptyTeams(), impact: undefined, effects: [] };
}

function teamFromComment(message: string): BambooTeam | undefined {
  const command = message.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().split(/\s+/)[0]?.replace(/^#/, '');
  if (['1', 'xanh', 'green', 'phe1', 'team1'].includes(command ?? '')) return 'green';
  if (['2', 'cam', 'orange', 'phe2', 'team2'].includes(command ?? '')) return 'orange';
  return undefined;
}

function eventViewer(payload: Record<string, unknown>): { id: string; name: string; avatar?: string } {
  const viewer = Object.keys(record(payload.viewer)).length ? record(payload.viewer) : Object.keys(record(payload.user)).length ? record(payload.user) : payload;
  const name = stringValue(viewer.name ?? viewer.nickname ?? viewer.displayName ?? payload.nickname ?? payload.uniqueId, 'Khách LIVE').slice(0, 48);
  const id = safeId(stringValue(viewer.id ?? viewer.userId ?? viewer.uniqueId ?? payload.userId ?? payload.uniqueId, name));
  const avatar = stringValue(viewer.avatar ?? viewer.avatarUrl ?? viewer.profilePictureUrl ?? payload.avatar ?? payload.profilePictureUrl).slice(0, 2_048);
  return { id, name, ...(avatar ? { avatar } : {}) };
}

function pushEffect(state: BambooBattleState, effect: BambooBattleEffect): Pick<BambooBattleState, 'impact' | 'effects'> {
  return { impact: effect, effects: [...state.effects, effect].slice(-BAMBOO_EFFECT_QUEUE_LIMIT) };
}

function addPower(state: BambooBattleState, player: BambooPlayer, kind: 'like' | 'gift', amount: number, likes: number, gifts: number, label: string, timestamp: number, diamonds = 0): BambooBattleState {
  const updatedPlayer = { ...player, contribution: player.contribution + amount, likes: player.likes + likes, gifts: player.gifts + gifts };
  const teamStats = state.teams[player.team];
  const updatedTeams = { ...state.teams, [player.team]: { power: teamStats.power + amount, likes: teamStats.likes + likes, gifts: teamStats.gifts + gifts } };
  const updatedPosition = tugPosition(updatedTeams.green.power, updatedTeams.orange.power);
  const knockout = Math.abs(updatedPosition) >= 44;
  const effect: BambooBattleEffect = {
    id: `${timestamp}-${player.id}-${kind}-${state.effects.length}`,
    team: player.team,
    kind,
    skill: kind === 'gift' ? resolveGiftSkill(diamonds) : 'pulse',
    name: player.name,
    label,
    power: amount,
    diamonds,
    at: timestamp,
  };
  return {
    ...state,
    position: updatedPosition,
    ...(knockout ? {
      status: 'finished' as const,
      remainingMs: 0,
      winner: updatedPosition > 0 ? 'green' as const : 'orange' as const,
      nextRoundAt: state.settings.autoRestart ? timestamp + 8_000 : undefined,
    } : {}),
    players: { ...state.players, [player.id]: updatedPlayer },
    teams: updatedTeams,
    ...pushEffect(state, effect),
  };
}

export function bambooBattleReducer(state: BambooBattleState, action: BambooBattleAction): BambooBattleState {
  if (action.type === 'configure') {
    const settings = {
      roundSeconds: clamp(Math.round(action.settings.roundSeconds ?? state.settings.roundSeconds), 30, 300),
      autoRestart: action.settings.autoRestart ?? state.settings.autoRestart,
      likePower: clamp(action.settings.likePower ?? state.settings.likePower, 0.01, 2),
      giftPower: clamp(action.settings.giftPower ?? state.settings.giftPower, 0.1, 5),
    };
    return { ...state, settings, ...(state.status === 'waiting' ? { remainingMs: settings.roundSeconds * 1_000 } : {}) };
  }
  if (action.type === 'start') return beginRound(state, action.now);
  if (action.type === 'tick') {
    if (state.status === 'finished' && state.settings.autoRestart && state.nextRoundAt && action.now >= state.nextRoundAt) return beginRound(state, action.now);
    if (state.status !== 'playing') return state;
    const remainingMs = Math.max(0, state.endsAt - action.now);
    if (remainingMs > 0) return { ...state, remainingMs, impact: state.impact && action.now - state.impact.at > 4_000 ? undefined : state.impact };
    const winner: BambooWinner = Math.abs(state.position) < 0.5 ? 'draw' : state.position > 0 ? 'green' : 'orange';
    return { ...state, status: 'finished', remainingMs: 0, winner, nextRoundAt: state.settings.autoRestart ? action.now + 8_000 : undefined, impact: undefined };
  }

  const normalized = normalizeEnvelope(action.event);
  if (normalized.type === 'game_action' && normalized.payload.action === 'restart') return beginRound(state, normalized.timestamp);
  if (state.status === 'waiting') return bambooBattleReducer(beginRound(state, normalized.timestamp), action);
  if (state.status !== 'playing') return state;
  const { type, payload, timestamp } = normalized;
  if (!['chat', 'like', 'gift'].includes(type)) return state;
  const viewer = eventViewer(payload);
  const player = state.players[viewer.id];

  if (type === 'chat') {
    if (player) return state;
    const team = teamFromComment(stringValue(payload.message ?? payload.comment ?? payload.text));
    if (!team) return state;
    const joined: BambooPlayer = { ...viewer, team, contribution: 3, likes: 0, gifts: 0, joinedAt: timestamp };
    const teamStats = state.teams[team];
    const updatedTeams = { ...state.teams, [team]: { ...teamStats, power: teamStats.power + 3 } };
    const effect: BambooBattleEffect = { id: `${timestamp}-${joined.id}-join-${state.effects.length}`, team, kind: 'join', skill: 'join', name: joined.name, label: `vào phe ${team === 'green' ? 'Xanh' : 'Cam'}`, power: 3, diamonds: 0, at: timestamp };
    return {
      ...state,
      position: tugPosition(updatedTeams.green.power, updatedTeams.orange.power),
      players: { ...state.players, [joined.id]: joined },
      teams: updatedTeams,
      ...pushEffect(state, effect),
    };
  }
  if (!player) return state;
  if (type === 'like') {
    const count = Math.max(1, numberValue(payload.likeCount ?? payload.count ?? payload.likes, 1));
    return addPower(state, player, 'like', Math.max(0.2, count * state.settings.likePower), count, 0, `${Math.round(count)} lượt thích`, timestamp);
  }
  const gift = record(payload.gift);
  const count = Math.max(1, numberValue(payload.giftCount ?? payload.repeatCount ?? payload.count ?? gift.count, 1));
  const diamonds = Math.max(0, numberValue(payload.diamonds ?? payload.diamondCount ?? gift.diamonds, 0));
  const totalDiamonds = diamonds * count;
  const amount = Math.max(4, totalDiamonds * state.settings.giftPower + count * 2);
  const giftName = stringValue(payload.giftName ?? payload.name ?? gift.name, 'Quà TikTok').slice(0, 60);
  return addPower(state, player, 'gift', amount, 0, count, `${giftName} ×${Math.round(count)}`, timestamp, totalDiamonds);
}

export function bambooTeamPlayers(state: BambooBattleState, team: BambooTeam): BambooPlayer[] {
  return Object.values(state.players).filter((player) => player.team === team).sort((a, b) => b.contribution - a.contribution || a.joinedAt - b.joinedAt);
}
