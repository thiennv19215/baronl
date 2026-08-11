import { describe, expect, it } from 'vitest';
import { bambooBattleReducer, createInitialBambooState } from './bambooBattle';

describe('bamboo battle', () => {
  it('joins teams from comments and applies likes and gifts to the chosen team', () => {
    let state = bambooBattleReducer(createInitialBambooState(), { type: 'start', now: 1_000 });
    state = bambooBattleReducer(state, { type: 'event', event: { type: 'chat', timestamp: 1_100, payload: { userId: 'lan', nickname: 'Lan', comment: '1' } } });
    expect(state.players.lan).toMatchObject({ team: 'green', name: 'Lan' });
    state = bambooBattleReducer(state, { type: 'event', event: { type: 'like', timestamp: 1_200, payload: { userId: 'lan', nickname: 'Lan', count: 100 } } });
    state = bambooBattleReducer(state, { type: 'event', event: { type: 'gift', timestamp: 1_300, payload: { userId: 'lan', nickname: 'Lan', giftName: 'Rose', count: 2, diamonds: 1 } } });
    expect(state.teams.green.likes).toBe(100);
    expect(state.teams.green.gifts).toBe(2);
    expect(state.position).toBeGreaterThan(0);
  });

  it('locks a viewer to one team for the round and ignores unassigned gifts', () => {
    let state = bambooBattleReducer(createInitialBambooState(), { type: 'start', now: 0 });
    state = bambooBattleReducer(state, { type: 'event', event: { type: 'gift', timestamp: 1, payload: { userId: 'guest', giftName: 'Rose', diamonds: 1 } } });
    expect(state.teams.green.gifts + state.teams.orange.gifts).toBe(0);
    state = bambooBattleReducer(state, { type: 'event', event: { type: 'chat', timestamp: 2, payload: { userId: 'guest', comment: '2' } } });
    state = bambooBattleReducer(state, { type: 'event', event: { type: 'chat', timestamp: 3, payload: { userId: 'guest', comment: '1' } } });
    expect(state.players.guest.team).toBe('orange');
  });

  it('finishes a round, declares a winner and auto-restarts', () => {
    let state = bambooBattleReducer(createInitialBambooState(), { type: 'configure', settings: { roundSeconds: 30, autoRestart: true } });
    state = bambooBattleReducer(state, { type: 'start', now: 1_000 });
    state = bambooBattleReducer(state, { type: 'event', event: { type: 'chat', timestamp: 1_100, payload: { userId: 'cam', comment: '2' } } });
    state = bambooBattleReducer(state, { type: 'event', event: { type: 'like', timestamp: 1_200, payload: { userId: 'cam', count: 100 } } });
    state = bambooBattleReducer(state, { type: 'tick', now: 31_001 });
    expect(state).toMatchObject({ status: 'finished', winner: 'orange', remainingMs: 0 });
    const nextRoundAt = state.nextRoundAt!;
    state = bambooBattleReducer(state, { type: 'tick', now: nextRoundAt });
    expect(state).toMatchObject({ status: 'playing', round: 2, position: 0 });
    expect(Object.keys(state.players)).toHaveLength(0);
  });

  it('starts a new round manually after a finished round', () => {
    let state = bambooBattleReducer(createInitialBambooState(), { type: 'start', now: 0 });
    state = bambooBattleReducer(state, { type: 'tick', now: 60_001 });
    expect(state.status).toBe('finished');
    state = bambooBattleReducer(state, { type: 'event', event: { type: 'game_action', timestamp: 70_000, payload: { action: 'restart' } } });
    expect(state).toMatchObject({ status: 'playing', round: 2, startedAt: 70_000 });
  });
});
