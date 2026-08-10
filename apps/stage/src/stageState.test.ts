import { describe, expect, it } from 'vitest';
import { getWebSocketUrl, initialStageState, normalizeEnvelope, stageReducer } from './stageState';

describe('stage event reducer', () => {
  it('normalizes TikFinity comment events', () => {
    const event = normalizeEnvelope({ event: 'comment', data: { nickname: 'Luna', comment: 'Xin chào' }, timestamp: 100 });
    expect(event.type).toBe('chat');
    expect(event.payload.comment).toBe('Xin chào');
  });

  it('updates viewer, leaderboard and super gift effect', () => {
    const state = stageReducer(initialStageState, { type: 'event', event: { type: 'gift', timestamp: 100, payload: { userId: 'luna', nickname: 'Luna', giftName: 'Galaxy', count: 2, diamonds: 1200, level: 21 } } });
    expect(state.viewers.luna.gifts).toBe(2);
    expect(state.leaderboard[0]).toBe('luna');
    expect(state.gifts[0].superGift).toBe(true);
    expect(state.spotlightViewer?.name).toBe('Luna');
    expect(state.viewers.luna).toMatchObject({ motion: 'gift', motionUntil: 8_100 });
  });

  it('supports the nested gift envelope used by Main', () => {
    const state = stageReducer(initialStageState, { type: 'event', event: { type: 'gift', timestamp: 101, payload: { id: 'gift-event-1', viewer: { id: 'nova-fan', name: 'Nova Fan', level: 14, title: 'Tinh tú' }, message: 'Tỏa sáng nhé!', gift: { name: 'Nebula', count: 4, diamonds: 1600, super: true } } } });
    expect(state.gifts[0]).toMatchObject({ id: 'gift-event-1', giftName: 'Nebula', count: 4, diamonds: 1600, superGift: true });
    expect(state.gifts[0].viewer.badge).toBe('Tinh tú');
  });

  it('synchronizes wish visibility and removes only the selected wish', () => {
    const gifted = stageReducer(initialStageState, { type: 'event', event: { type: 'gift', timestamp: 101, payload: { id: 'wish-1', viewer: { id: 'nova-fan', name: 'Nova Fan' }, message: 'Tỏa sáng nhé!', gift: { name: 'Nebula', count: 1, diamonds: 10 } } } });
    const hidden = stageReducer(gifted, { type: 'event', event: { type: 'wishes', payload: { items: [{ id: 'wish-1', viewerId: 'nova-fan', viewerName: 'Nova Fan', message: 'Tỏa sáng nhé!', createdAt: '2026-08-10T00:00:00.000Z', visible: false }] } } });
    expect(hidden.wishes).toHaveLength(1);
    expect(hidden.gifts[0].wish).toBeUndefined();

    const removed = stageReducer(hidden, { type: 'event', event: { type: 'wish:remove', payload: { id: 'wish-1' } } });
    expect(removed.wishes).toHaveLength(0);
    expect(removed.gifts[0].wish).toBeUndefined();
  });

  it('expires transient stage items', () => {
    const gifted = stageReducer(initialStageState, { type: 'event', event: { type: 'gift', timestamp: 100, payload: { userId: 'a', giftName: 'Rose' } } });
    const expired = stageReducer(gifted, { type: 'expire', now: 20_000 });
    expect(expired.gifts).toHaveLength(0);
  });

  it('uses explicit websocket query before local default', () => {
    expect(getWebSocketUrl({ protocol: 'http:', hostname: 'localhost', port: '5174', search: '?ws=ws%3A%2F%2F127.0.0.1%3A17321%2Fevents' } as Location)).toBe('ws://127.0.0.1:17321/events');
  });

  it('does not let TikFinity snapshot status overwrite the Stage transport', () => {
    const connected = { ...initialStageState, connection: 'connected' as const };
    const next = stageReducer(connected, { type: 'event', event: { type: 'snapshot', payload: { connection: 'offline', live: false, viewerCount: 2 } } });
    expect(next.connection).toBe('connected');
    expect(next.viewerCount).toBe(2);
  });
});
